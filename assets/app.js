// Backend Server URL (Render-ல் நாம் உருவாக்கிய சர்வர் லிங்க்)
const BACKEND_URL = "https://goodvexa-rummy-server.onrender.com";

// செய்தி அல்லது அறிவிப்புகளைக் காண்பிக்கும் பங்கஷன்
function showMessage(message) {
  const box = document.getElementById("message");
  if (!box) return;

  box.textContent = message;
  box.style.display = "block";

  clearTimeout(window.messageTimer);

  window.messageTimer = setTimeout(function () {
    box.style.display = "none";
  }, 3000);
}

// பயனர்கள் லாகின் செய்ய அல்லது புதிய கணக்கு உருவாக்க (₹1,00,000 விர்ச்சுவல் மணியுடன்)
async function handleUserLogin(username) {
  try {
    if (!username) {
      showMessage("தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்!");
      return;
    }

    showMessage("தகவல்கள் சரிபார்க்கబడుகிறது...");

    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username })
    });

    const data = await response.json();

    if (data.success) {
      showMessage(`நல்வரவு ${data.user.username}! வாலட் இருப்பு: ₹${data.user.wallet}`);
      
      // பயனரின் விவரங்களை பிரவுசரில் சேமித்துக்கொள்ளலாம்
      localStorage.setItem("rummy_user", JSON.stringify(data.user));
      
      // சிறிது நேரத்திற்குப் பிறகு விளையாட்டுப் பக்கத்திற்குச் செல்லலாம் (தேவைப்பட்டால் மாற்றிக் கொள்ளலாம்)
      // window.location.href = "practice.html";
    } else {
      showMessage(data.error || "உள்நுழைவதில் பிழை ஏற்பட்டுள்ளது.");
    }
  } catch (err) {
    console.error("Login Error:", err);
    showMessage("சர்வர் இணைப்பில் கோளாறு ஏற்பட்டுள்ளது. பிறகு முயற்சிக்கவும்.");
  }
}

// ஆப் இயங்கத் தொடங்கியதும் செய்ய வேண்டியவை
document.addEventListener("DOMContentLoaded", () => {
  console.log("Goodvexa Rummy Frontend Connected Successfully!");
});
