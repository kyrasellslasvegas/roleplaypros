type ConnectResult = {
  pc: RTCPeerConnection;
  stream: MediaStream;
};

export async function connectVoice(): Promise<ConnectResult> {
  const pc = new RTCPeerConnection();

  // ✅ mic
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  for (const track of stream.getTracks()) pc.addTrack(track, stream);

  // ✅ create offer SDP
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  if (!offer.sdp) throw new Error("Offer SDP missing");

  // ✅ IMPORTANT: send RAW SDP TEXT (not JSON)
  const res = await fetch("/api/realtime/webrtc", {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: offer.sdp,
  });

  const answerSdp = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`Voice connect failed: ${res.status} ${answerSdp}`);
  }

  if (!answerSdp.includes("v=0")) {
    throw new Error("Voice connect failed: server did not return SDP answer.");
  }

  // ✅ set remote description from SDP answer text
  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

  return { pc, stream };
}

export function disconnectVoice(conn: {
  pc?: RTCPeerConnection | null;
  stream?: MediaStream | null;
}) {
  try {
    conn.stream?.getTracks?.().forEach((t) => t.stop());
  } catch {}
  try {
    conn.pc?.close?.();
  } catch {}
}
