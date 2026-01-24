import { useEffect, useState } from "react";

export default function Popup() {
  const [tokens, setTokens] = useState(0);
  const [platform, setPlatform] = useState("");

  useEffect(() => {
  chrome.storage.local.get(
    ["tokensBefore", "platform"],
    (data: { tokensBefore?: number; platform?: string }) => {
      setTokens(data.tokensBefore || 0);
      setPlatform(data.platform || "");
    }
  );
}, []);


  return (
    <div style={{ padding: 10 }}>
      <h3>GAIA</h3>
      <p>Platform: {platform}</p>
      <p>Tokens: {tokens}</p>
      <button>Optimize Prompt</button>
    </div>
  );
}
