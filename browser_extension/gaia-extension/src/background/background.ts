const API_BASE = "http://localhost:3001/api/auth/exbackend";

console.log("🚀 GAIA Background Service Worker Started");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📨 Message received:", msg.type);

  // ==================== GET TOKEN ====================
  if (msg.type === "GET_TOKEN") {
    chrome.storage.local.get(["jwt"], (res) => {
      if (chrome.runtime.lastError) {
        console.error("❌ Storage error:", chrome.runtime.lastError);
        sendResponse({ token: null });
        return;
      }
      
      const token = res.jwt || null;
      console.log(`🔐 Token ${token ? "found" : "not found"}`);
      sendResponse({ token });
    });
    return true; // Keep message channel open for async response
  }

  // ==================== LOGIN ====================
  if (msg.type === "LOGIN") {
    const { email, password } = msg.payload || {};

    if (!email || !password) {
      console.error("❌ Missing credentials");
      sendResponse({ success: false, error: "Email and password required" });
      return true;
    }

    console.log(`🔑 Attempting login for: ${email}`);

    fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        const data = await res.json();
        
        if (!res.ok) {
          console.error(`❌ Login failed (${res.status}):`, data.error);
          throw new Error(data.error || "Login failed");
        }

        if (!data.token) {
          console.error("❌ No token in response");
          throw new Error("No token received");
        }

        return data;
      })
      .then((data) => {
        console.log("✅ Login successful");
        
        // Store JWT token
        chrome.storage.local.set({ jwt: data.token }, () => {
          if (chrome.runtime.lastError) {
            console.error("❌ Token storage error:", chrome.runtime.lastError);
            sendResponse({ success: false, error: "Failed to store token" });
            return;
          }
          
          console.log("💾 Token stored successfully");
          sendResponse({ 
            success: true, 
            user: data.user,
            token: data.token 
          });
        });
      })
      .catch((err) => {
        console.error("❌ LOGIN ERROR:", err.message);
        sendResponse({ 
          success: false, 
          error: err.message || "Login failed" 
        });
      });

    return true; // Keep message channel open for async response
  }

  // ==================== REGISTER ====================
  if (msg.type === "REGISTER") {
    const { email, password } = msg.payload || {};

    if (!email || !password) {
      console.error("❌ Missing credentials");
      sendResponse({ success: false, error: "Email and password required" });
      return true;
    }

    console.log(`📝 Attempting registration for: ${email}`);

    fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        const data = await res.json();
        
        if (!res.ok) {
          console.error(`❌ Registration failed (${res.status}):`, data.error);
          throw new Error(data.error || "Registration failed");
        }

        if (!data.token) {
          console.error("❌ No token in response");
          throw new Error("No token received");
        }

        return data;
      })
      .then((data) => {
        console.log("✅ Registration successful");
        
        // Store JWT token
        chrome.storage.local.set({ jwt: data.token }, () => {
          if (chrome.runtime.lastError) {
            console.error("❌ Token storage error:", chrome.runtime.lastError);
            sendResponse({ success: false, error: "Failed to store token" });
            return;
          }
          
          console.log("💾 Token stored successfully");
          sendResponse({ 
            success: true, 
            user: data.user,
            token: data.token 
          });
        });
      })
      .catch((err) => {
        console.error("❌ REGISTRATION ERROR:", err.message);
        sendResponse({ 
          success: false, 
          error: err.message || "Registration failed" 
        });
      });

    return true; // Keep message channel open for async response
  }

  // ==================== LOGOUT ====================
  if (msg.type === "LOGOUT") {
    console.log("🚪 Logging out...");
    
    chrome.storage.local.remove("jwt", () => {
      if (chrome.runtime.lastError) {
        console.error("❌ Logout error:", chrome.runtime.lastError);
        sendResponse({ success: false });
        return;
      }
      
      console.log("✅ Logged out successfully");
      sendResponse({ success: true });
    });
    
    return true; // Keep message channel open for async response
  }

  // ==================== VERIFY TOKEN ====================
  if (msg.type === "VERIFY_TOKEN") {
    chrome.storage.local.get(["jwt"], (res) => {
      const token = res.jwt;

      if (!token) {
        console.log("⚠️ No token to verify");
        sendResponse({ valid: false });
        return;
      }

      fetch("http://localhost:3001/api/auth/verify", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          const data = await res.json();
          
          if (!res.ok) {
            console.error("❌ Token verification failed");
            // Clear invalid token
            chrome.storage.local.remove("jwt");
            return { valid: false };
          }

          console.log("✅ Token verified");
          return { valid: true, user: data.user };
        })
        .then((result) => {
          sendResponse(result);
        })
        .catch((err) => {
          console.error("❌ VERIFY ERROR:", err);
          sendResponse({ valid: false });
        });
    });

    return true; // Keep message channel open for async response
  }


  // ==================== SEND METRICS ====================
if (msg.type === "SEND_METRICS") {
  chrome.storage.local.get(["jwt"], (res) => {
    const token = res.jwt;

    if (!token) {
      sendResponse({ success: false, error: "No auth token" });
      return;
    }

    fetch("http://localhost:3001/api/extension/metrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(msg.payload),
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send metrics");
        }

        sendResponse({ success: true, data });
      })
      .catch((err) => {
        console.error("❌ METRICS ERROR:", err.message);
        sendResponse({ success: false, error: err.message });
      });
  });

  return true; // IMPORTANT
}

  // Unknown message type
  console.warn("⚠️ Unknown message type:", msg.type);
  return false;
});

// Log when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("🎉 GAIA Extension installed!");
  } else if (details.reason === "update") {
    console.log("🔄 GAIA Extension updated!");
  }
});

console.log("✅ Background service worker ready");