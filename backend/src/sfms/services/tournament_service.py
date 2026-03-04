from __future__ import annotations

import math
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class TournamentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_tournaments(self, facility_id: int) -> list[dict]:
        result = await self.db.execute(
            text(
                """SELECT t.*,
                          (SELECT COUNT(*) FROM tournament_team tt WHERE tt.tournament_id = t.id AND tt.status != 'withdrawn') as team_count
                   FROM tournament t
                   WHERE t.facility_id = :fid
                   ORDER BY t.start_date DESC"""
            ),
            {"fid": facility_id},
        )
        return [dict(r) for r in result.mappings().all()]

    async def get_tournament(self, tournament_id: int, facility_id: int | None = None) -> dict | None:
        query = """SELECT t.*,
                          (SELECT COUNT(*) FROM tournament_team tt WHERE tt.tournament_id = t.id AND tt.status != 'withdrawn') as team_count
                   FROM tournament t WHERE t.id = :id"""
        params: dict = {"id": tournament_id}
        if facility_id:
            query += " AND t.facility_id = :fid"
            params["fid"] = facility_id
        result = await self.db.execute(text(query), params)
        row = result.mappings().first()
        return dict(row) if row else None

    async def create_tournament(self, facility_id: int, created_by: int, data: dict) -> dict:
        result = await self.db.execute(
            text(
                """INSERT INTO tournament
                   (facility_id, name, sport, format, start_date, end_date,
                    registration_deadline, max_teams, entry_fee, prize_pool,
                    rules, description, contact_phone, is_public, created_by)
                   VALUES (:fid, :name, :sport, :format, :start_date, :end_date,
                           :reg_deadline, :max_teams, :entry_fee, :prize_pool,
                           :rules, :description, :contact_phone, :is_public, :created_by)
                   RETURNING *"""
            ),
            {
                "fid": facility_id,
                "name": data["name"],
                "sport": data["sport"],
                "format": data.get("format", "single_elimination"),
                "start_date": data["start_date"],
                "end_date": data.get("end_date"),
                "reg_deadline": data.get("registration_deadline"),
                "max_teams": data.get("max_teams"),
                "entry_fee": data.get("entry_fee", 0),
                "prize_pool": data.get("prize_pool"),
                "rules": data.get("rules"),
                "description": data.get("description"),
                "contact_phone": data.get("contact_phone"),
                "is_public": data.get("is_public", True),
                "created_by": created_by,
            },
        )
        await self.db.commit()
        row = result.mappings().first()
        d = dict(row)
        d["team_count"] = 0
        return d

    async def update_tournament(self, tournament_id: int, facility_id: int, data: dict) -> dict | None:
        sets = []
        params: dict = {"id": tournament_id, "fid": facility_id}
        for key, val in data.items():
            if val is not None:
                sets.append(f"{key} = :{key}")
                params[key] = val
        if not sets:
            return await self.get_tournament(tournament_id, facility_id)
        sets.append("updated_at = NOW()")
        set_clause = ", ".join(sets)
        result = await self.db.execute(
            text(f"UPDATE tournament SET {set_clause} WHERE id = :id AND facility_id = :fid RETURNING *"),
            params,
        )
        await self.db.commit()
        row = result.mappings().first()
        if not row:
            return None
        return await self.get_tournament(tournament_id, facility_id)

    async def delete_tournament(self, tournament_id: int, facility_id: int) -> bool:
        result = await self.db.execute(
            text("DELETE FROM tournament WHERE id = :id AND facility_id = :fid RETURNING id"),
            {"id": tournament_id, "fid": facility_id},
        )
        await self.db.commit()
        return result.mappings().first() is not None

    # --- Teams ---

    async def list_teams(self, tournament_id: int) -> list[dict]:
        result = await self.db.execute(
            text("SELECT * FROM tournament_team WHERE tournament_id = :tid ORDER BY seed NULLS LAST, registered_at"),
            {"tid": tournament_id},
        )
        return [dict(r) for r in result.mappings().all()]

    async def register_team(self, tournament_id: int, data: dict, registered_by: int | None = None) -> dict:
        result = await self.db.execute(
            text(
                """INSERT INTO tournament_team
                   (tournament_id, team_name, player1_name, player1_phone, player1_email,
                    player2_name, player2_phone, registered_by)
                   VALUES (:tid, :team_name, :p1_name, :p1_phone, :p1_email,
                           :p2_name, :p2_phone, :reg_by)
                   RETURNING *"""
            ),
            {
                "tid": tournament_id,
                "team_name": data["team_name"],
                "p1_name": data["player1_name"],
                "p1_phone": data.get("player1_phone"),
                "p1_email": data.get("player1_email"),
                "p2_name": data.get("player2_name"),
                "p2_phone": data.get("player2_phone"),
                "reg_by": registered_by,
            },
        )
        await self.db.commit()
        return dict(result.mappings().first())

    async def withdraw_team(self, team_id: int, tournament_id: int) -> bool:
        result = await self.db.execute(
            text(
                "UPDATE tournament_team SET status = 'withdrawn' WHERE id = :id AND tournament_id = :tid RETURNING id"
            ),
            {"id": team_id, "tid": tournament_id},
        )
        await self.db.commit()
        return result.mappings().first() is not None

    # --- Matches ---

    async def list_matches(self, tournament_id: int) -> list[dict]:
        result = await self.db.execute(
            text(
                """SELECT m.*,
                          t1.team_name as team1_name,
                          t2.team_name as team2_name,
                          w.team_name as winner_name
                   FROM tournament_match m
                   LEFT JOIN tournament_team t1 ON m.team1_id = t1.id
                   LEFT JOIN tournament_team t2 ON m.team2_id = t2.id
                   LEFT JOIN tournament_team w ON m.winner_id = w.id
                   WHERE m.tournament_id = :tid
                   ORDER BY m.round, m.match_number"""
            ),
            {"tid": tournament_id},
        )
        return [dict(r) for r in result.mappings().all()]

    async def update_match(self, match_id: int, tournament_id: int, data: dict) -> dict | None:
        sets = []
        params: dict = {"id": match_id, "tid": tournament_id}
        for key, val in data.items():
            if val is not None:
                sets.append(f"{key} = :{key}")
                params[key] = val
        if not sets:
            return None
        sets.append("updated_at = NOW()")
        set_clause = ", ".join(sets)
        result = await self.db.execute(
            text(f"UPDATE tournament_match SET {set_clause} WHERE id = :id AND tournament_id = :tid RETURNING *"),
            params,
        )
        await self.db.commit()
        row = result.mappings().first()
        if not row:
            return None

        # If winner set, advance to next match
        if data.get("winner_id") and data.get("status") == "completed":
            await self._advance_winner(tournament_id, dict(row))

        full = await self.db.execute(
            text(
                """SELECT m.*, t1.team_name as team1_name, t2.team_name as team2_name, w.team_name as winner_name
                   FROM tournament_match m
                   LEFT JOIN tournament_team t1 ON m.team1_id = t1.id
                   LEFT JOIN tournament_team t2 ON m.team2_id = t2.id
                   LEFT JOIN tournament_team w ON m.winner_id = w.id
                   WHERE m.id = :id"""
            ),
            {"id": match_id},
        )
        return dict(full.mappings().first())

    async def generate_bracket(self, tournament_id: int, facility_id: int) -> list[dict]:
        """Generate single-elimination bracket from registered teams."""
        tournament = await self.get_tournament(tournament_id, facility_id)
        if not tournament:
            raise ValueError("Tournament not found")

        teams = await self.list_teams(tournament_id)
        active_teams = [t for t in teams if t["status"] != "withdrawn"]
        if len(active_teams) < 2:
            raise ValueError("Need at least 2 teams to generate bracket")

        # Clear existing matches
        await self.db.execute(
            text("DELETE FROM tournament_match WHERE tournament_id = :tid"),
            {"tid": tournament_id},
        )

        n = len(active_teams)
        total_rounds = math.ceil(math.log2(n))
        bracket_size = 2**total_rounds
        seeded = active_teams[:bracket_size]

        match_number = 0
        round_num = 1

        # First round
        team_idx = 0
        for i in range(bracket_size // 2):
            match_number += 1
            t1_id = seeded[team_idx]["id"] if team_idx < n else None
            team_idx += 1
            t2_id = seeded[team_idx]["id"] if team_idx < n else None
            team_idx += 1

            is_bye = t1_id is None or t2_id is None
            winner = t1_id if t2_id is None else (t2_id if t1_id is None else None)

            await self.db.execute(
                text(
                    """INSERT INTO tournament_match
                       (tournament_id, round, match_number, team1_id, team2_id, winner_id, status)
                       VALUES (:tid, :round, :mn, :t1, :t2, :winner, :status)"""
                ),
                {
                    "tid": tournament_id,
                    "round": round_num,
                    "mn": match_number,
                    "t1": t1_id,
                    "t2": t2_id,
                    "winner": winner,
                    "status": "bye" if is_bye else "scheduled",
                },
            )

        # Subsequent rounds (empty matches)
        for r in range(2, total_rounds + 1):
            matches_in_round = bracket_size // (2**r)
            for i in range(matches_in_round):
                match_number += 1
                await self.db.execute(
                    text(
                        """INSERT INTO tournament_match
                           (tournament_id, round, match_number, status)
                           VALUES (:tid, :round, :mn, 'scheduled')"""
                    ),
                    {"tid": tournament_id, "round": r, "mn": match_number},
                )

        # Update tournament status
        await self.db.execute(
            text("UPDATE tournament SET status = 'in_progress', updated_at = NOW() WHERE id = :id"),
            {"id": tournament_id},
        )
        await self.db.commit()

        return await self.list_matches(tournament_id)

    async def _advance_winner(self, tournament_id: int, completed_match: dict):
        """Advance the winner of a match to the next round."""
        current_round = completed_match["round"]
        current_mn = completed_match["match_number"]
        winner_id = completed_match["winner_id"]

        first_round_count = await self.db.execute(
            text("SELECT COUNT(*) FROM tournament_match WHERE tournament_id = :tid AND round = 1"),
            {"tid": tournament_id},
        )
        r1_count = first_round_count.scalar_one()
        total_rounds = math.ceil(math.log2(r1_count * 2))

        if current_round >= total_rounds:
            await self.db.execute(
                text("UPDATE tournament SET status = 'completed', updated_at = NOW() WHERE id = :tid"),
                {"tid": tournament_id},
            )
            await self.db.commit()
            return

        matches_before = 0
        for r in range(1, current_round):
            matches_before += r1_count * 2 // (2**r)

        match_idx_in_round = current_mn - matches_before - 1
        next_match_idx = match_idx_in_round // 2

        next_round = current_round + 1
        matches_before_next = 0
        for r in range(1, next_round):
            matches_before_next += r1_count * 2 // (2**r)

        next_mn = matches_before_next + next_match_idx + 1
        slot = "team1_id" if match_idx_in_round % 2 == 0 else "team2_id"

        await self.db.execute(
            text(
                f"UPDATE tournament_match SET {slot} = :winner WHERE tournament_id = :tid AND round = :round AND match_number = :mn"
            ),
            {"winner": winner_id, "tid": tournament_id, "round": next_round, "mn": next_mn},
        )
        await self.db.commit()
