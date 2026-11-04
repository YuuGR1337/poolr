# Updater signing continuity

v0.6.5 establishes the persistent updater key. The encrypted private key, password and public key are stored in ~/.env.master (0600). GitHub Actions uses POOLR_UPDATER_PRIVATE_KEY and POOLR_UPDATER_KEY_PASSWORD secrets. Never regenerate this key for routine releases; securely back up the environment file outside the repository. The previous key is preserved locally in ~/.env.master.before-poolr-key-rotation.

Install v0.6.5 manually to trust this key. Earlier installations cannot securely accept a different signing key automatically. Signature verification remains enabled. Future releases must retain the public key and be signed using the same secrets. v0.6.5 installers remain draft until build checks complete.
