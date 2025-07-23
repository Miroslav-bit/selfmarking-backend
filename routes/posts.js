<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <title>Objave - Selfmarking</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .breadcrumb {
      font-size: 16px;
      margin-bottom: 10px;
      color: #555;
    }
    .post {
      background-color: #f2f2f2;
      padding: 10px;
      margin-bottom: 15px;
      border-left: 5px solid #3498db;
    }
    .post-date {
      font-size: 12px;
      color: gray;
      margin-bottom: 5px;
    }
    .post-autor {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .avatar-small {
      height: 30px;
      width: 30px;
      border-radius: 50%;
      margin-right: 10px;
    }
    .user-block {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    }
    .user-block img {
      width: 60px;
      height: 60px;
      border-radius: 50%;
    }
    .rating-box {
      border: 1px solid #ccc;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      background-color: #f9f9f9;
    }
    .rating-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .raters a {
      text-decoration: none;
      color: #3498db;
      font-weight: bold;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 16px;
      transition: background-color 0.3s ease;
    }
    .raters a:hover {
      background-color: #e0f0ff;
    }
    .rate-button .ocenite-dugme {
      background-color: #add8e6;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      cursor: default;
    }
    .rate a:hover {
      background-color: #e0f0ff;
    }
    .average-score-box {
      position: relative;
      display: flex;
      justify-content: flex-end;
      margin-bottom: 10px;
    }
    .star-rating {
      display: flex;
      align-items: center;
      margin-right: 10px;
      gap: 1px;
    }
    .star-rating svg {
      width: 20px;
      height: 20px;
    }
    #averageScore {
      width: 90px;
      height: 30px;
      background-color: white;
      border: 3px solid red;
      clip-path: polygon(
        50% 0%, 60% 35%, 100% 35%, 68% 60%,
        80% 100%, 50% 75%, 20% 100%, 32% 60%,
        0% 35%, 40% 35%
      );
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      color: black;
      font-size: 16px;
    }
    .validation-buttons {
      margin-top: 10px;
      display: flex;
      gap: 10px;
    }

    .confirm-button,
    .deny-button {
      padding: 8px 14px;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-weight: bold;
    }

    .confirm-button {
      background-color: #27ae60;
    }

    .confirm-button.active {
      background-color: #145e32;
    }

    .deny-button {
      background-color: #e74c3c;
    }

    .deny-button.active {
      background-color: #992d22;
    }
  </style>
</head>
<body>
  <div class="container">
    <div id="userIdBlock">Učitavanje korisnika...</div>

    <div class="breadcrumb" id="breadcrumb">Lična vrednost ></div>
    <h2 id="tema-naslov">Tema</h2>

    <div class="rating-box">
      <div style="font-weight: bold; text-align: center; margin-bottom: 5px;">Srednja ocena</div>
      <div class="average-score-box">
        <div class="star-rating" id="starRating"></div>
        <div id="averageScore">–</div>
      </div>
      <div class="rating-buttons">
        <div class="raters"></div>
        <div class="rate"></div>
      </div>
    </div>

    <section class="form-section">
      <textarea id="postText" placeholder="Unesi svoju objavu..."></textarea>
      <input type="text" id="imageUrl" placeholder="Unesi URL slike (opciono)" style="width:100%; padding:10px; margin-top:10px; border-radius:5px;">
      <input type="text" id="videoUrl" placeholder="Unesi URL video snimka (opciono)" style="width:100%; padding:10px; margin-top:10px; border-radius:5px;">
      <button onclick="addPost()">Dodaj objavu</button>
    </section>

    <section class="posts-section">
      <h3>Objave</h3>
      <div id="postsContainer"></div>
    </section>
  </div>

  <script>

    function slugify(text) {
      return text.normalize("NFD")
                 .replace(/[\u0300-\u036f]/g, "")
                 .toLowerCase()
                 .replace(/\s+/g, "-")
                 .replace(/[^\w\-]+/g, "")
                 .replace(/\-\-+/g, "-")
                 .replace(/^-+/, "")
                 .replace(/-+$/, "");
    }

    const params = new URLSearchParams(window.location.search);
    const main = params.get('main');
    const sub = params.get('sub');
    const ownerId = params.get('user');
    const viewerToken = localStorage.getItem("token");

    if (!main || !sub || !ownerId || !viewerToken) {
      alert("Greška: Nedostaju podaci.");
      window.location.href = "login.html";
    }

    const format = txt => txt.replace(/-/g, ' ');
    document.getElementById("tema-naslov").innerText = format(sub);

    fetch(`https://selfmarking-backend.onrender.com/api/user/${ownerId}/panel`, {
      headers: { "Authorization": "Bearer " + viewerToken }
    })
    .then(res => res.json())
    .then(data => {
      const block = document.getElementById("userIdBlock");
      block.innerHTML = `
        <div class="user-block">
          <img src="${data.avatar || 'default-avatar.png'}" alt="avatar">
          <div>
            <strong>${data.name || ''} ${data.surname || ''}</strong><br>
            Živi u: ${data.city || 'Nepoznato'}<br>
          </div>
        </div>
      `;
      const fullName = `${data.name || ''} ${data.surname || ''}`.trim();
      document.getElementById("tema-naslov").innerText = `${fullName} – ${sub.replace(/-/g, ' ')}`;

      localStorage.setItem("ime", data.name || "");
      localStorage.setItem("prezime", data.surname || "");

      document.getElementById("breadcrumb").innerHTML = `
        <a href="index.html">Home</a> &gt;
        <a href="main-categories.html?user=${ownerId}">${fullName}</a> &gt;
        <a href="subcategories.html?main=${main}&user=${ownerId}">${format(main)}</a> &gt;
        ${format(sub)}
      `;

      // Učitavanje brojčanika ocenjivača
      fetch(`https://selfmarking-backend.onrender.com/api/ratings/raters?cardName=${encodeURIComponent(data.name + ' ' + data.surname)}&cardSub=${encodeURIComponent(format(sub))}`)
        .then(res => res.json())
        .then(raters => {
          const broj = raters.length;
          document.querySelector(".raters").innerHTML = `
            <img src="icons/raters.png" style="height:18px; vertical-align:middle;">
            <a href="raters.html?name=${encodeURIComponent(data.name)}&surname=${encodeURIComponent(data.surname)}&sub=${encodeURIComponent(sub)}">Ocenjivači (${broj})</a>
          `;

          // Izračunavanje prosečne ocene
          const zbir = raters.reduce((sum, r) => sum + (r.score || 0), 0);
          const prosek = broj > 0 ? (zbir / broj).toFixed(2) : "–";
          document.getElementById("averageScore").innerText = prosek;
          updateStarRating(parseFloat(prosek));
        })
        .catch(err => {
          console.error("Greška pri učitavanju broja ocenjivača:", err);
          document.querySelector(".raters").innerHTML = `
            <img src="icons/raters.png" style="height:18px; vertical-align:middle;">
            <a href="raters.html?name=${encodeURIComponent(data.name)}&surname=${encodeURIComponent(data.surname)}&sub=${encodeURIComponent(sub)}">Ocenjivači</a>
          `;
          document.getElementById("averageScore").innerText = "–";
        });

      document.querySelector(".rate").innerHTML = `
        <img src="icons/rate.png" style="height:18px; vertical-align:middle;">
        <a href="rate.html?name=${encodeURIComponent(data.name)}&surname=${encodeURIComponent(data.surname)}&main=${encodeURIComponent(main)}&sub=${encodeURIComponent(sub)}&user=${ownerId}">☆ Ocenite</a>
      `;
    });

    async function addPost() {
      const textArea = document.getElementById("postText");
      const imageUrlInput = document.getElementById("imageUrl");
      const text = textArea.value.trim();
      const imageUrl = imageUrlInput.value.trim();
      const token = localStorage.getItem("token");
      const videoUrlInput = document.getElementById("videoUrl");
      const videoUrl = videoUrlInput.value.trim();

      if (!text) {
        alert("Unesi neki tekst.");
        return;
      }

      try {
        const res = await fetch("https://selfmarking-backend.onrender.com/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({
            text,
            imageUrl: imageUrl || null,
            videoUrl: videoUrl || null,
            panelOwnerId: ownerId,
            mainCategory: main,
            subCategory: sub
          })
        });

        if (res.ok) {
          textArea.value = "";
          imageUrlInput.value = "";
          videoUrlInput.value = "";
          loadPosts();
        } else {
          const data = await res.json();
          alert(data.msg || "Greška pri objavljivanju.");
        }
      } catch (err) {
        console.error("Greška:", err);
        alert("Greška pri slanju objave.");
      }
    }

    async function loadPosts() {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`https://selfmarking-backend.onrender.com/api/posts/filter?ownerId=${ownerId}&mainCategory=${main}&subCategory=${sub}`);
        const posts = await res.json();

        const container = document.getElementById("postsContainer");
        container.innerHTML = "";

        posts.forEach(post => {
          const div = document.createElement("div");
          div.className = "post";

          const autor = document.createElement("div");
          autor.className = "post-autor";
          autor.innerHTML = `<img src="${post.user?.avatarUrl || 'default-avatar.png'}" class="avatar-small">
                             <strong>${post.user?.name || 'Nepoznat'} ${post.user?.surname || ''}</strong>`;

          const datum = document.createElement("div");
          datum.className = "post-date";
          datum.innerText = new Date(post.date).toLocaleString("sr-RS");

          const tekst = document.createElement("div");
          tekst.innerText = post.text;

          div.appendChild(autor);
          div.appendChild(datum);
          div.appendChild(tekst);

          if (post.imageUrl) {
            const img = document.createElement("img");
            img.src = post.imageUrl;
            img.alt = "Korisnička slika";
            img.style.maxWidth = "100%";
            img.style.marginTop = "10px";
            img.style.borderRadius = "8px";
            img.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
            div.appendChild(img);
          }

          if (post.videoUrl) {
            const videoWrapper = document.createElement("div");
            videoWrapper.style.marginTop = "10px";

            if (post.videoUrl.endsWith(".mp4")) {
              const video = document.createElement("video");
              video.src = post.videoUrl;
              video.controls = true;
              video.style.maxWidth = "100%";
              video.style.borderRadius = "8px";
              videoWrapper.appendChild(video);
            } else if (post.videoUrl.includes("youtube.com/watch?v=")) {
              const videoId = post.videoUrl.split("v=")[1].split("&")[0];
              const embedUrl = `https://www.youtube.com/embed/${videoId}`;
              const iframe = document.createElement("iframe");
              iframe.src = embedUrl;
              iframe.allowFullscreen = true;
              iframe.style.width = "100%";
              iframe.style.height = "315px";
              iframe.style.border = "none";
              iframe.style.borderRadius = "8px";
              videoWrapper.appendChild(iframe);
            } else if (post.videoUrl.includes("youtu.be/")) {
              const videoId = post.videoUrl.split("youtu.be/")[1].split("?")[0];
              const embedUrl = `https://www.youtube.com/embed/${videoId}`;
              const iframe = document.createElement("iframe");
              iframe.src = embedUrl;
              iframe.allowFullscreen = true;
              iframe.style.width = "100%";
              iframe.style.height = "315px";
              iframe.style.border = "none";
              iframe.style.borderRadius = "8px";
              videoWrapper.appendChild(iframe);
            } else if (post.videoUrl.includes("vimeo.com")) {
              const videoId = post.videoUrl.split("vimeo.com/")[1].split("/")[0];
              const embedUrl = `https://player.vimeo.com/video/${videoId}`;
              const iframe = document.createElement("iframe");
              iframe.src = embedUrl;
              iframe.allowFullscreen = true;
              iframe.style.width = "100%";
              iframe.style.height = "315px";
              iframe.style.border = "none";
              iframe.style.borderRadius = "8px";
              videoWrapper.appendChild(iframe);
            }

            div.appendChild(videoWrapper);
          }

          // Dugme za prikaz replika sa brojačem
          const showRepliesBtn = document.createElement("button");

          fetch(`https://selfmarking-backend.onrender.com/api/replies/${post._id}`)
            .then(res => res.json())
            .then(replies => {
              const brojReplika = replies.length;
              showRepliesBtn.textContent = `Replike (${brojReplika})`;
            })
            .catch(() => {
              showRepliesBtn.textContent = "Replike (0)";
            });

          showRepliesBtn.onclick = () => loadReplies(post._id, div);
          div.appendChild(showRepliesBtn);

          // Dugme za unos nove replike
          const replyBtn = document.createElement("button");
          replyBtn.textContent = "Repliciraj";
          replyBtn.onclick = () => showReplyForm(post._id, div);
          div.appendChild(replyBtn);

          // Dugmad za potvrdu/demantovanje
          const validationDiv = document.createElement("div");
          validationDiv.className = "validation-buttons";

          const confirmBtn = document.createElement("button");
          confirmBtn.className = "confirm-button";
          confirmBtn.textContent = "Potvrdi";

          const denyBtn = document.createElement("button");
          denyBtn.className = "deny-button";
          denyBtn.textContent = "Demantuj";

          // ✅ Provera statusa validacije za ovog korisnika
          fetch(`https://selfmarking-backend.onrender.com/api/posts/validation-status/${post._id}`, {
            method: "GET",
            headers: {
              "Authorization": "Bearer " + token
            }
          })
          .then(res => res.json())
          .then(statusData => {
            if (statusData.confirmed) {
              confirmBtn.classList.add("active");
              confirmBtn.textContent = "POTVRĐENO";
            }
            if (statusData.denied) {
              denyBtn.classList.add("active");
              denyBtn.textContent = "DEMANTOVANO";
            }
          })
          .catch(err => {
            console.error("Greška pri dohvatanju statusa validacije:", err);
          });

          confirmBtn.onclick = () => {
            fetch(`https://selfmarking-backend.onrender.com/api/posts/confirm/${post._id}`, {
              method: "POST",
              headers: {
                "Authorization": "Bearer " + token
              }
            })
            .then(res => res.json())
            .then(() => {
              confirmBtn.classList.add("active");
              confirmBtn.textContent = "POTVRĐENO";
              denyBtn.classList.remove("active");
              denyBtn.textContent = "Demantuj";
              location.reload();
            });
          };

          denyBtn.onclick = () => {
            fetch(`https://selfmarking-backend.onrender.com/api/posts/deny/${post._id}`, {
              method: "POST",
              headers: {
                "Authorization": "Bearer " + token
              }
            })
            .then(res => res.json())
            .then(() => {
              denyBtn.classList.add("active");
              denyBtn.textContent = "DEMANTOVANO";
              confirmBtn.classList.remove("active");
              confirmBtn.textContent = "Potvrdi";
              location.reload();
            });
          };

          validationDiv.appendChild(confirmBtn);
          validationDiv.appendChild(denyBtn);
          div.appendChild(validationDiv);

          // Dugmad za prikaz stranica "Potvrde" i "Demanti"
          const dodatnaDugmad = document.createElement("div");

          // Podesi podrazumevane vrednosti
          let brojPotvrda = 0;
          let brojDemantija = 0;

          // Fetch za broj potvrda i demantija
          fetch(`https://selfmarking-backend.onrender.com/api/posts/validators/${post._id}`)
            .then(res => res.json())
            .then(data => {
              brojPotvrda = data.confirmators.length;
              brojDemantija = data.deniers.length;

              dodatnaDugmad.innerHTML = `
                <button onclick="window.location.href='potvrde.html?postId=${post._id}'" style="background-color: green; color: white; border: none; padding: 5px 10px; margin-left: 5px;">
                  Potvrde (${brojPotvrda})
                </button>
                <button onclick="window.location.href='demanti.html?postId=${post._id}'" style="background-color: red; color: white; border: none; padding: 5px 10px; margin-left: 5px;">
                  Demanti (${brojDemantija})
                </button>
              `;
            })
            .catch(() => {
              // Ako API ne radi, prikaži nule
              dodatnaDugmad.innerHTML = `
                <button onclick="window.location.href='potvrde.html?postId=${post._id}'" style="background-color: green; color: white; border: none; padding: 5px 10px; margin-left: 5px;">
                  Potvrde (0)
                </button>
                <button onclick="window.location.href='demanti.html?postId=${post._id}'" style="background-color: red; color: white; border: none; padding: 5px 10px; margin-left: 5px;">
                  Demanti (0)
                </button>
              `;
            });

          div.appendChild(dodatnaDugmad);

          container.appendChild(div);
        });
      } catch (err) {
        console.error("Greška:", err);
        alert("Greška pri učitavanju objava.");
      }
    }

    function loadReplies(postId, container) {
      // Očisti stare replike, ako ih ima
      const oldReplies = container.querySelector(".reply-list");
      if (oldReplies) oldReplies.remove();

      fetch(`https://selfmarking-backend.onrender.com/api/replies/${postId}`)
        .then(res => res.json())
        .then(replies => {
          const replyList = document.createElement("div");
          replyList.className = "reply-list";
          replyList.style.marginTop = "10px";
          replies.forEach(reply => {
            const replyDiv = document.createElement("div");
            const authorName = reply.user?.name && reply.user?.surname
              ? `${reply.user.name} ${reply.user.surname}`
              : "Nepoznat član";

            replyDiv.innerHTML = `<strong>${authorName}:</strong> ${reply.text}`;
            replyList.appendChild(replyDiv);
          });
          container.appendChild(replyList);
        });
    }

    function showReplyForm(postId, container) {
      const formDiv = document.createElement("div");
      const textarea = document.createElement("textarea");
      const submitBtn = document.createElement("button");
      submitBtn.textContent = "Pošalji";

      submitBtn.onclick = () => {
        const token = localStorage.getItem("token");
        fetch('https://selfmarking-backend.onrender.com/api/replies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ postId, text: textarea.value })
        })
        .then(res => res.json())
        .then((newReply) => {
          textarea.value = "";
          alert("Replika sačuvana!");
          loadReplies(postId, container);

          // Ažuriranje brojača replika
          fetch(`https://selfmarking-backend.onrender.com/api/replies/${postId}`)
            .then(res => res.json())
            .then(replies => {
              const btn = container.querySelector("button");
              if (btn) btn.textContent = `Replike (${replies.length})`;
            });
        });
      };

      formDiv.appendChild(textarea);
      formDiv.appendChild(submitBtn);
      container.appendChild(formDiv);
    }

    window.onload = loadPosts;
    function updateStarRating(score) {
      const starContainer = document.getElementById("starRating");
      if (!starContainer) return;

      starContainer.innerHTML = "";

      for (let i = 1; i <= 10; i++) {
        let fill = 0;
        if (i <= Math.floor(score)) {
          fill = 1;
        } else if (i - score < 1) {
          fill = score % 1;
        }

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        // kontura zvezde
        path.setAttribute("d", "M12 2l3 7h7l-5.7 4.1L18.6 21 12 16.8 5.4 21l2.3-7.9L2 9h7z");
        path.setAttribute("fill", "white");
        path.setAttribute("stroke", "red");
        path.setAttribute("stroke-width", "1");

        svg.appendChild(path);
        starContainer.appendChild(svg);

        if (fill > 0) {
          const fillRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          fillRect.setAttribute("x", "0");
          fillRect.setAttribute("y", "0");
          fillRect.setAttribute("width", `${24 * fill}`);
          fillRect.setAttribute("height", "24");
          fillRect.setAttribute("fill", "red");
          fillRect.setAttribute("mask", "url(#starMask" + i + ")");

          const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
          mask.setAttribute("id", "starMask" + i);
          const maskPath = path.cloneNode();
          maskPath.setAttribute("fill", "white");
          mask.appendChild(maskPath);
          svg.appendChild(mask);
          svg.appendChild(fillRect);
        }
      }
    }

    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll('.confirm-button').forEach(button => {
        button.addEventListener('click', () => {
          const denyButton = button.parentElement.querySelector('.deny-button');
          const isActive = button.classList.contains('active');

          if (isActive) {
            button.classList.remove('active');
          } else {
            button.classList.add('active');
            denyButton.classList.remove('active');
          }
        });
      });

      document.querySelectorAll('.deny-button').forEach(button => {
        button.addEventListener('click', () => {
          const confirmButton = button.parentElement.querySelector('.confirm-button');
          const isActive = button.classList.contains('active');

          if (isActive) {
            button.classList.remove('active');
          } else {
            button.classList.add('active');
            confirmButton.classList.remove('active');
          }
        });
      });
    });

  </script>
</body>
</html>
