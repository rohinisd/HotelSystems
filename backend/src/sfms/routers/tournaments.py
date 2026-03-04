from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from sfms.dependencies import get_current_user, get_db, get_tenant_id, require_roles
from sfms.models.schemas import (
    MatchResponse,
    MatchUpdate,
    TeamRegister,
    TeamResponse,
    TournamentCreate,
    TournamentResponse,
    TournamentUpdate,
)
from sfms.services.tournament_service import TournamentService

router = APIRouter(prefix="/tournaments", tags=["Tournaments"])


# --- Public endpoints (must be defined before /{tournament_id} to avoid path conflicts) ---

@router.get("/public/{tournament_id}")
async def get_public_tournament(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint to view tournament details (no auth required)."""
    svc = TournamentService(db)
    t = await svc.get_tournament(tournament_id)
    if not t or not t.get("is_public", True):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return t


@router.get("/public/{tournament_id}/teams")
async def get_public_teams(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
):
    svc = TournamentService(db)
    t = await svc.get_tournament(tournament_id)
    if not t or not t.get("is_public", True):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return await svc.list_teams(tournament_id)


@router.get("/public/{tournament_id}/matches")
async def get_public_matches(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
):
    svc = TournamentService(db)
    t = await svc.get_tournament(tournament_id)
    if not t or not t.get("is_public", True):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return await svc.list_matches(tournament_id)


@router.post("/public/{tournament_id}/register", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def public_register_team(
    tournament_id: int,
    req: TeamRegister,
    db: AsyncSession = Depends(get_db),
):
    """Public registration endpoint (no auth required for public tournaments)."""
    svc = TournamentService(db)
    t = await svc.get_tournament(tournament_id)
    if not t:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    if not t.get("is_public", True):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tournament is not public")
    if t["status"] not in ("draft", "registration_open"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Registration is closed")
    if t["max_teams"] and t["team_count"] >= t["max_teams"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tournament is full")
    try:
        return await svc.register_team(tournament_id, req.model_dump())
    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(status.HTTP_409_CONFLICT, "Team name already registered")
        raise


# --- Authenticated tournament CRUD ---

@router.get("", response_model=list[TournamentResponse])
async def list_tournaments(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")
    svc = TournamentService(db)
    return await svc.list_tournaments(tenant_id)


@router.post("", response_model=TournamentResponse, status_code=status.HTTP_201_CREATED)
async def create_tournament(
    req: TournamentCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")
    svc = TournamentService(db)
    return await svc.create_tournament(tenant_id, int(user["sub"]), req.model_dump())


@router.get("/{tournament_id}", response_model=TournamentResponse)
async def get_tournament(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")
    svc = TournamentService(db)
    t = await svc.get_tournament(tournament_id, tenant_id)
    if not t:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return t


@router.put("/{tournament_id}", response_model=TournamentResponse)
async def update_tournament(
    tournament_id: int,
    req: TournamentUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")
    svc = TournamentService(db)
    t = await svc.update_tournament(tournament_id, tenant_id, req.model_dump(exclude_unset=True))
    if not t:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    return t


@router.delete("/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tournament(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")
    svc = TournamentService(db)
    if not await svc.delete_tournament(tournament_id, tenant_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")


# --- Teams ---

@router.get("/{tournament_id}/teams", response_model=list[TeamResponse])
async def list_teams(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    svc = TournamentService(db)
    return await svc.list_teams(tournament_id)


@router.post("/{tournament_id}/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def register_team(
    tournament_id: int,
    req: TeamRegister,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    svc = TournamentService(db)
    tournament = await svc.get_tournament(tournament_id)
    if not tournament:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tournament not found")
    if tournament["status"] not in ("draft", "registration_open"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Registration is closed")
    if tournament["max_teams"] and tournament["team_count"] >= tournament["max_teams"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tournament is full")
    try:
        return await svc.register_team(tournament_id, req.model_dump(), int(user["sub"]))
    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(status.HTTP_409_CONFLICT, "Team name already registered")
        raise


@router.delete("/{tournament_id}/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_team(
    tournament_id: int,
    team_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
):
    svc = TournamentService(db)
    if not await svc.withdraw_team(team_id, tournament_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")


# --- Matches ---

@router.get("/{tournament_id}/matches", response_model=list[MatchResponse])
async def list_matches(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    svc = TournamentService(db)
    return await svc.list_matches(tournament_id)


@router.post("/{tournament_id}/bracket")
async def generate_bracket(
    tournament_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
    tenant_id: int | None = Depends(get_tenant_id),
):
    if not tenant_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tenant context required")
    svc = TournamentService(db)
    try:
        matches = await svc.generate_bracket(tournament_id, tenant_id)
        return {"matches": matches, "status": "bracket_generated"}
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.patch("/{tournament_id}/matches/{match_id}", response_model=MatchResponse)
async def update_match(
    tournament_id: int,
    match_id: int,
    req: MatchUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_roles("owner", "manager")),
):
    svc = TournamentService(db)
    m = await svc.update_match(match_id, tournament_id, req.model_dump(exclude_unset=True))
    if not m:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Match not found")
    return m
