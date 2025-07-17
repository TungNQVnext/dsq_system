# SECRET_KEY Security Guidelines

## Current Setup
- ✅ Strong SECRET_KEY implemented (64 chars hex)
- ✅ Environment variable configuration
- ✅ Security validation in jwt_utils.py

## Generate New SECRET_KEY (if needed)
```python
import secrets
secret_key = secrets.token_hex(32)  # 64 chars
```

## Security Checklist
- [ ] SECRET_KEY > 32 characters
- [ ] Stored in .env file
- [ ] .env in .gitignore
- [ ] Rotate every 3-6 months
- [ ] Never commit to git

## Emergency Response
If SECRET_KEY compromised:
1. Generate new key immediately
2. Update .env file
3. Restart application
4. All users must re-login
