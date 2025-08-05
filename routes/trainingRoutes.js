<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <title>Treninzi - Selfmarking</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .breadcrumb {
      font-size: 16px;
      margin-bottom: 10px;
      color: #555;
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
    }
    .average-score-box {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .star-rating {
      display: flex;
      align-items: center;
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
      clip-path: polygon(50% 0%, 60% 35%, 100% 35%, 68% 60%, 80% 100%, 50% 75%, 20% 100%, 32% 60%, 0% 35%, 40% 35%);
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      color: black;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div id="userIdBlock">Učitavanje korisnika...</div>

    <div class="breadcrumb" id="breadcrumb">Navigacija...</div>
    <h2 id="tema-naslov">Naslov</h2>

    <div id="tab-buttons" style="margin-bottom: 20px;"></div>

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

    <div id="etapaSelection">
      <h3>Odaberite etapu treninga:</h3>
      <div id="etapaButtons" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>
    </div>

  <script>
    const params = new URLSearchParams(window.location.search);
    const main = params.get('main');
    const sub = params.get('sub');
    const ownerId = params.get('user');
    const token = localStorage.getItem("token");

    let delayPerDay = {}; // ključ = dan treninga, vrednost = broj dana odlaganja
    let currentEtapa = null;

    const format = txt => {
      const text = txt.replace(/-/g, ' ');
      return text.charAt(0).toUpperCase() + text.slice(1);
    };

    document.getElementById("tema-naslov").innerText = format(sub);

    fetch(`https://selfmarking-backend.onrender.com/api/user/${ownerId}/panel`)
      .then(res => res.json())
      .then(data => {
        const fullName = `${data.name} ${data.surname}`;
        const subFormatted = format(sub);

        document.getElementById("userIdBlock").innerHTML = `
          <div class="user-block">
            <img src="${data.avatar || 'default-avatar.png'}" alt="avatar">
            <div>
              <strong>${fullName}</strong><br>
              Živi u: ${data.city || 'Nepoznato'}
            </div>
          </div>
        `;

        document.getElementById("breadcrumb").innerHTML = `
          <a href="index.html">Home</a> &gt;
          <a href="main-categories.html?user=${ownerId}">${fullName}</a> &gt;
          <a href="subcategories.html?user=${ownerId}&main=${main}">${format(main)}</a> &gt;
          ${subFormatted}
        `;

        document.getElementById("tema-naslov").innerText = `${fullName} – ${subFormatted}`;

        // Dugmad za prebacivanje između Testovi / Objave / Treninzi
        const page = location.pathname.split("/").pop(); // npr. posts.html
        const tabButtons = document.getElementById("tab-buttons");

        const pages = {
          "posts.html": "Objave",
          "tests.html": "Testovi",
          "training.html": "Treninzi"
        };

        Object.entries(pages).forEach(([file, label]) => {
          const button = document.createElement("button");
          button.textContent = label;
          button.style.marginRight = "10px";
          button.style.padding = "8px 16px";
          button.style.borderRadius = "6px";
          button.style.border = "none";
          button.style.fontWeight = "bold";
         button.style.cursor = (file === page) ? "default" : "pointer";

          if (file === page) {
            button.style.backgroundColor = "#888";
            button.style.color = "white";
          } else {
            button.style.backgroundColor = "#eee";
            button.style.color = "black";
            button.onclick = () => {
              window.location.href = `${file}?main=${main}&sub=${sub}&user=${ownerId}`;
            };
          }

          tabButtons.appendChild(button);
        });

        fetch(`https://selfmarking-backend.onrender.com/api/ratings/raters?cardName=${encodeURIComponent(fullName)}&cardSub=${encodeURIComponent(subFormatted)}`)
          .then(res => res.json())
          .then(raters => {
            const broj = raters.length;
            document.querySelector(".raters").innerHTML = `
              <img src="icons/raters.png" style="height:18px; vertical-align:middle;">
              <a href="raters.html?name=${encodeURIComponent(data.name)}&surname=${encodeURIComponent(data.surname)}&sub=${encodeURIComponent(subFormatted)}">Ocenjivači (${broj})</a>
              &nbsp;&nbsp;
              <a href="points.html?ime=${encodeURIComponent(data.name)}&prezime=${encodeURIComponent(data.surname)}&sub=${encodeURIComponent(subFormatted)}">AI bodovi</a>
            `;

            const zbir = raters.reduce((sum, r) => sum + (r.score || 0), 0);
            const prosek = broj > 0 ? (zbir / broj).toFixed(2) : "–";
            document.getElementById("averageScore").innerText = prosek;
            updateStarRating(parseFloat(prosek));
          });

        if (token) {
          document.querySelector(".rate").innerHTML = `
            <img src="icons/rate.png" style="height:18px; vertical-align:middle;">
            <a href="rate.html?name=${encodeURIComponent(data.name)}&surname=${encodeURIComponent(data.surname)}&main=${main}&sub=${subFormatted}&user=${ownerId}">☆ Ocenite</a>
          `;
        }
      });

    function updateStarRating(score) {
      const starContainer = document.getElementById("starRating");
      if (!starContainer) return;
      starContainer.innerHTML = "";

      for (let i = 1; i <= 10; i++) {
        let fill = 0;
        if (i <= Math.floor(score)) fill = 1;
        else if (i - score < 1) fill = score % 1;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
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

          const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
          const maskId = `mask-${Math.random().toString(36).substr(2, 9)}`;
          mask.setAttribute("id", maskId);
          const maskPath = path.cloneNode();
          maskPath.setAttribute("fill", "white");
          mask.appendChild(maskPath);
          svg.appendChild(mask);
          fillRect.setAttribute("mask", `url(#${maskId})`);
          svg.appendChild(fillRect);
        }
      }
    }
    const etapaButtons = document.getElementById("etapaButtons");

    for (let i = 1; i <= 10; i++) {
      const btn = document.createElement("button");
      btn.textContent = `Etapa ${i}`;
      btn.style.padding = "10px";
      btn.style.border = "1px solid #ccc";
      btn.style.borderRadius = "6px";
      btn.style.cursor = "pointer";
      btn.onclick = () => startEtapa(i);
      etapaButtons.appendChild(btn);
    }

    function startEtapa(etapa) {
      currentEtapa = etapa;
      delayPerDay = {}; // reset svih pomeranja po danima
      const korigovanaOcena = etapa - 1;
      console.log(`Odabrana etapa: ${etapa}, početna GPT ocena korigovana na: ${korigovanaOcena}`);

      document.getElementById("etapaSelection").innerHTML = `<p>Učitavanje plana treninga za etapu ${etapa}...</p>`;

      const subCategory = sub.toLowerCase();

      fetch(`https://selfmarking-backend.onrender.com/api/training/${subCategory}/${etapa}`)
        .then(res => {
          if (!res.ok) throw new Error("Etapa nije pronađena");
          return res.json();
        })
        .then(data => {
          // Uklanjamo dugmad: "Potvrdi / Odloži / Odustani"
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.html, 'text/html');

          const buttons = doc.querySelectorAll("button");
          buttons.forEach(btn => btn.remove());

          const htmlWithoutActionButtons = doc.body.innerHTML;

          // Prikaz banera sa dva dugmeta: Prihvati / Odbaci
          const baner = `
            <div id="baner-trening" style="position:sticky; top:0; background: #fff8dc; border: 2px solid black; padding: 10px; margin-bottom: 20px; text-align:center; z-index:1000;">
              <strong>Da li želite da započnete ovaj trening?</strong><br><br>
              <button id="btn-prihvati" style="background-color: green; color: white; font-weight: bold; padding: 10px 20px; margin-right: 20px; border-radius: 6px; border: 2px solid black; cursor: pointer;">
                ✅ Prihvati trening
              </button>
              <button id="btn-odbaci" style="background-color: crimson; color: white; font-weight: bold; padding: 10px 20px; border-radius: 6px; border: 2px solid black; cursor: pointer;">
                ❌ Odbaci trening
              </button>
            </div>
          `;

          document.getElementById("etapaSelection").innerHTML = `${baner}${htmlWithoutActionButtons}`;

          // Dodavanje event listenere
          document.getElementById("btn-prihvati").onclick = () => prihvatiTrening(data.html);
          document.getElementById("btn-odbaci").onclick = () => location.reload();
        })
        .catch(err => {
          console.error(err);
          document.getElementById("etapaSelection").innerHTML = `<p style="color:red;">Greška pri učitavanju sadržaja.</p>`;
        });
    }

    function prihvatiTrening(originalHtml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(originalHtml, 'text/html');

      const baner = document.getElementById("baner-trening");
      if (baner) baner.remove();

      const content = doc.body.innerHTML;
      document.getElementById("etapaSelection").innerHTML = content;

      const prviDanTd = Array.from(document.querySelectorAll("td")).find(td =>
        td.textContent.trim().toLowerCase().startsWith("1. dan treninga")
      );
      if (prviDanTd) {
        const dugmeOdlozi = document.createElement("button");
        dugmeOdlozi.textContent = "⏩ Odloži";
        dugmeOdlozi.style.marginLeft = "10px";
        dugmeOdlozi.style.padding = "5px 12px";
        dugmeOdlozi.style.fontWeight = "bold";
        dugmeOdlozi.style.cursor = "pointer";
        dugmeOdlozi.style.backgroundColor = "#ffcc00";
        dugmeOdlozi.style.border = "1px solid black";
        dugmeOdlozi.onclick = () => {
          delayOffset++;
          prihvatiTrening(originalHtml); // ponovo učitaj datume sa povećanjem
        };
        prviDanTd.appendChild(dugmeOdlozi);
      }

      const danas = new Date();
      const dateCells = document.querySelectorAll("td");

      dateCells.forEach(cell => {
        const tekst = cell.textContent.trim().toLowerCase();
        const match = tekst.match(/^(\d+)\.\s+dan treninga/);

        if (match) {
          const dayNum = parseInt(match[1]);
          const targetCell = cell.parentElement.nextElementSibling?.children[0];

          if (targetCell && targetCell.textContent.trim() === "–") {
            // Izračunaj ukupan delay: zbir svih prethodnih dana
            let totalDelay = 0;
            for (let i = 1; i < dayNum; i++) {
              totalDelay += delayPerDay[i] || 0;
            }

            const datum = new Date(danas);
            datum.setDate(datum.getDate() + dayNum - 1 + totalDelay);
            const dan = String(datum.getDate()).padStart(2, '0');
            const mesec = String(datum.getMonth() + 1).padStart(2, '0');
            const godina = datum.getFullYear();
            targetCell.textContent = `${dan}.${mesec}.${godina}.`;

            // Dodaj dugme "⏩ Odloži"
            const dugme = document.createElement("button");
            dugme.textContent = "⏩ Odloži";
            dugme.style.marginLeft = "10px";
            dugme.style.padding = "5px 10px";
            dugme.style.backgroundColor = "#ffcc00";
            dugme.style.border = "1px solid black";
            dugme.style.cursor = "pointer";
            dugme.style.fontWeight = "bold";
            dugme.onclick = () => {
              // Povećaj kašnjenje za kliknuti dan
              delayPerDay[dayNum] = (delayPerDay[dayNum] || 0) + 1;

              // Ažuriraj i trenutni datum (dan koji je kliknut)
              const totalDelay = Object.entries(delayPerDay)
                .filter(([key]) => parseInt(key) <= dayNum)
                .reduce((sum, [_, val]) => sum + val, 0);

              const noviDatum = new Date(danas);
              noviDatum.setDate(danas.getDate() + dayNum - 1 + totalDelay);
              const d = String(noviDatum.getDate()).padStart(2, '0');
              const m = String(noviDatum.getMonth() + 1).padStart(2, '0');
              const g = noviDatum.getFullYear();
              targetCell.textContent = `${d}.${m}.${g}.`;

              // Ponovo iscrtaj ostale datume
              prihvatiTrening(originalHtml);
            };

            cell.appendChild(dugme);
          }
        }
      });

      // Prikaz obaveštenja "Trening je prihvaćen!"
      const notifikacija = document.createElement("div");
      notifikacija.textContent = "✅ Trening je prihvaćen!";
      notifikacija.style.backgroundColor = "#d4edda";
      notifikacija.style.border = "2px solid #155724";
      notifikacija.style.color = "#155724";
      notifikacija.style.padding = "12px";
      notifikacija.style.marginBottom = "15px";
      notifikacija.style.fontWeight = "bold";
      notifikacija.style.borderRadius = "6px";
      notifikacija.style.textAlign = "center";
      notifikacija.style.fontSize = "16px";
      notifikacija.id = "prihvacenBanner";

      // Ubaci baner iznad trening plana
      const target = document.getElementById("etapaSelection");
      target.prepend(notifikacija);

      // Automatsko uklanjanje nakon 3 sekunde
      setTimeout(() => {
        notifikacija.remove();
      }, 3000);

      // Slanje na backend da se trajno sačuva izabrani trening
      fetch("https://selfmarking-backend.onrender.com/api/training/save-full", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: ownerId,
          sub,
          etapa: parseInt(originalHtml.match(/Etapa\s*(\d+)/)?.[1] || "1"),
          html: content,
          delayMap: delayPerDay
        })
      });

      // Dodaj funkcionalnost za dugme "Odustani"
      const odustaniBtns = Array.from(document.querySelectorAll("button"))
        .filter(btn => btn.textContent.trim().toLowerCase().includes("odustani"));

      odustaniBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const potvrda = confirm("Da li ste sigurni da želite da odustanete od ovog treninga?");
          if (potvrda) {
            fetch("https://selfmarking-backend.onrender.com/api/training/save-full", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                userId: ownerId,
                sub,
                etapa: null,
                html: ""
              })
            }).then(() => {
              window.location.href = `training.html?main=${main}&sub=${sub}&user=${ownerId}`;
            });
          }
        });
      });
    }

    // Učitavanje opisa svih etapa
    fetch(`https://selfmarking-backend.onrender.com/api/training-menu/${sub.toLowerCase()}`)
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const descriptions = doc.querySelectorAll('div');

        const buttons = document.querySelectorAll('#etapaButtons button');
        buttons.forEach((btn, i) => {
          const desc = descriptions[i]?.innerHTML || '';
          const wrapper = document.createElement('div');
          wrapper.style.display = 'flex';
          wrapper.style.flexDirection = 'column';
          wrapper.style.alignItems = 'flex-start';
          wrapper.appendChild(btn);

          const text = document.createElement('div');
          text.style.border = '1px solid #ccc';
          text.style.padding = '6px';
          text.style.marginTop = '4px';
          text.style.fontSize = '14px';
          text.innerHTML = desc;
          wrapper.appendChild(text);

          etapaButtons.appendChild(wrapper);
        });
      })
      .catch(err => {
        console.error("Ne mogu da učitam opise etapa:", err);
      });

    // Automatsko prikazivanje sačuvanog treninga (ako postoji)
    if (token) {
      const currentUserId = JSON.parse(atob(token.split('.')[1])).id;

      if (currentUserId === ownerId) {
        fetch(`https://selfmarking-backend.onrender.com/api/training/saved?user=${ownerId}&sub=${sub}`)
          .then(res => res.json())
          .then(data => {
            if (data.html) {
              delayPerDay = data.delayMap || {};
              document.getElementById("etapaSelection").innerHTML = data.html;

              const odustaniBtns = Array.from(document.querySelectorAll("button"))
                .filter(btn => btn.textContent.trim().toLowerCase().includes("odustani"));

              odustaniBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                  const potvrda = confirm("Da li ste sigurni da želite da odustanete od ovog treninga?");
                  if (potvrda) {
                    fetch("https://selfmarking-backend.onrender.com/api/training/save-full", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        userId: ownerId,
                        sub,
                        etapa: null,
                        html: ""
                      })
                    }).then(() => {
                      window.location.href = `training.html?main=${main}&sub=${sub}&user=${ownerId}`;
                    });
                  }
                });
              });
            }
          })
          .catch(err => {
            console.error("Greška pri učitavanju sačuvanog treninga:", err);
          });
      }
    }

  </script>
</body>
</html>
