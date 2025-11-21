const JSZip = window.JSZip;

export async function exportFramesAsZip(frames, frameCount, fps) {
  const zip = new JSZip();
  const folder = zip.folder(`snow_overlay_${frameCount}f_${fps}fps`);

  for (const {blob, index} of frames) {
    const name = `snow_${String(index).padStart(4, '0')}.png`;
    folder.file(name, blob);
  }

  const blob = await zip.generateAsync({type: 'blob'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `snow_overlay_${frameCount}f_${fps}fps.zip`;
  a.click();
  URL.revokeObjectURL(url);
}