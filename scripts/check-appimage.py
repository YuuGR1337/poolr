#!/usr/bin/env python3
import os
import pathlib
import subprocess
import sys
import tempfile

pattern = pathlib.Path(sys.argv[1])
appimages = sorted(pattern.parent.glob(pattern.name))
if len(appimages) != 1:
    raise SystemExit(f"Expected one AppImage at {pattern}, found {len(appimages)}")
appimage = appimages[0].resolve()
with tempfile.TemporaryDirectory(prefix="poolr-appimage-") as temp:
    subprocess.run([str(appimage), "--appimage-extract"], cwd=temp, check=True, env={**os.environ, "APPIMAGE_EXTRACT_AND_RUN": "1"}, stdout=subprocess.DEVNULL)
    libs = pathlib.Path(temp, "squashfs-root/usr/lib")
    forbidden = ("libwayland-", "libxkbcommon", "libxcb-", "libXau", "libXdmcp")
    found = sorted(p.name for p in libs.glob("*") if any(p.name.startswith(prefix) for prefix in forbidden))
    if found:
        raise SystemExit("AppImage bundles host display libraries that break Mesa/WebKit: " + ", ".join(found))
print("AppImage display stack is host-provided")
