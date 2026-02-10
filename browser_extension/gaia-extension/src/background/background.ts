const API_BASE = "http://localhost:3000/api/auth/exbackend";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === "GET_TOKEN") {
    chrome.storage.local.get(["jwt"], (res) => {
      sendResponse({ token: res.jwt || null });
    });
    return true; // async
  }

  if (msg.type === "LOGIN") {
    fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(msg.payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.token) {
          throw new Error("Login failed");
        }
        return data;
      })
      .then((data) => {
        //  Store JWT
        chrome.storage.local.set({ jwt: data.token }, () => {
          sendResponse({ success: true });
        });
      })
      .catch((err) => {
        console.error("LOGIN ERROR:", err);
        sendResponse({ success: false });
      });

    return true; // IMPORTANT: async response
  }


  if (msg.type === "LOGOUT") {
    chrome.storage.local.remove("jwt", () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
