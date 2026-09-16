#!/bin/bash
# Blend theme renders -> audio/blend/<theme>/<name>.aac
#
# HANDOFF §3: AAC 192k, 48 kHz, -18 LUFS integrated, true peak -1.5 dBTP.
# Two passes, but a PLAIN GAIN rather than loudnorm's second pass: loudnorm with
# linear=true silently falls back to dynamic mode when it dislikes the
# measurement, which it did on three of Theme 2's renders. Dynamic mode is a
# compressor, and this material exists to be listened to for timbre.
# The gain is whichever is smaller — what reaches -18 LUFS, or what leaves the
# true peak at -1.5 dBTP.
#
# NO TRIMMING. Every render is 552960 frames bounced from one project, aligned
# by construction. §3's "trim to ~10 ms" is for standalone demos, not for a set
# that gets layered.
set -e
SRC="${1:?usage: blend-encode.sh <source-dir> <out-dir> <pattern> <name=file>...}"
OUT="${2:?}"; PAT="${3:?}"; shift 3
mkdir -p "$OUT"
for pair in "$@"; do
  name="${pair%%=*}"; tag="${pair#*=}"
  src=$(ls "$SRC"/*"${PAT}_${tag}".wav 2>/dev/null | head -1)
  [ -z "$src" ] && { echo "  !! no source for $tag"; continue; }
  dst="$OUT/$name.aac"
  j=$(ffmpeg -hide_banner -nostats -i "$src" -af loudnorm=print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
  i=$(echo "$j"  | grep input_i  | cut -d'"' -f4)
  tp=$(echo "$j" | grep input_tp | cut -d'"' -f4)
  g=$(python3 -c "print(f'{min(-18-($i), -1.5-($tp)):.2f}')")
  ffmpeg -hide_banner -nostats -loglevel error -y -i "$src" -af "volume=${g}dB" \
    -c:a aac -b:a 192k -ar 48000 -ac 2 "$dst"
  printf '  %-14s %8s LUFS  gain %+6s dB\n' "$name" "$i" "$g"
done
