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
    culprit = list(libs.glob("libwayland-client.so.0*"))
    if culprit:
        raise SystemExit("AppImage bundles libwayland-client, which breaks Mesa/WebKit EGL on this target")
print("AppImage excludes the Wayland client library that caused the target EGL failure")
