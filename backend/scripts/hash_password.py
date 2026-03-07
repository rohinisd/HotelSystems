#!/usr/bin/env python3
"""Generate bcrypt hash for a password (same as auth uses). Run: python scripts/hash_password.py [password]"""
import sys

def main():
    password = sys.argv[1] if len(sys.argv) > 1 else "password1234"
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed = pwd_context.hash(password)
    except ImportError:
        import bcrypt
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
    print(hashed)

if __name__ == "__main__":
    main()
