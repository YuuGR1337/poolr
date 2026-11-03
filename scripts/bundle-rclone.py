"""Bundle a pinned rclone executable; verify the official SHA-256 before extraction."""
import hashlib
import io
from pathlib import Path
import sys
import urllib.request
import zipfile

VERSION = '1.75.2'
TARGETS = {'win-x64': ('windows', 'amd64'), 'win-x86': ('windows', '386'),
           'win-arm64': ('windows', 'arm64'), 'osx-x64': ('osx', 'amd64'),
           'osx-arm64': ('osx', 'arm64'), 'linux-x64': ('linux', 'amd64')}

def bundle(rid, destination):
    system, arch = TARGETS[rid]
    name = f'rclone-v{VERSION}-{system}-{arch}'
    base = f'https://github.com/rclone/rclone/releases/download/v{VERSION}/'
    with urllib.request.urlopen(base + 'SHA256SUMS', timeout=60) as response:
        checksums = response.read().decode()
    expected = next(line.split()[0] for line in checksums.splitlines() if len(line.split()) == 2 and line.split()[-1].lstrip('*') == name + '.zip')
    with urllib.request.urlopen(base + name + '.zip', timeout=120) as response:
        data = response.read()
    if hashlib.sha256(data).hexdigest().lower() != expected.lower():
        raise ValueError('rclone checksum mismatch')
    destination.mkdir(parents=True, exist_ok=True)
    executable = 'rclone.exe' if system == 'windows' else 'rclone'
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        (destination / executable).write_bytes(archive.read(name + '/' + executable))
    with urllib.request.urlopen(f'https://raw.githubusercontent.com/rclone/rclone/v{VERSION}/COPYING', timeout=60) as response:
        (destination / 'RCLONE-LICENSE.txt').write_bytes(response.read())
    (destination / executable).chmod(0o755)
    print(f'Bundled verified rclone {VERSION} for {rid}')

if __name__ == '__main__':
    if sys.argv[1:] == ['--check']:
        assert len(TARGETS) == 6 and all(arch in ('amd64', '386', 'arm64') for _, arch in TARGETS.values())
    else:
        bundle(sys.argv[1], Path(sys.argv[2]))
