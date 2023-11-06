document.addEventListener("DOMContentLoaded", () => {
  const socket = new WebSocket("ws://localhost:12345"); // Reemplaza con la dirección del servidor

  const cartillas = [];
  const cartillaWidth = "30%"; // Cada cartilla ocupará un tercio del ancho de la pantalla
  let juegoIniciado = false;

  const numerosSeleccionados = new Set();

  const agregarCartilla = () => {
    if (!juegoIniciado) {
      const nuevaCartilla = generarCartilla();
      document.getElementById("cartillas").appendChild(nuevaCartilla);
      cartillas.push(nuevaCartilla);
    }
  };

  const generarCartilla = () => {
    const cartillaDiv = document.createElement("div");
    cartillaDiv.classList.add("cartilla");
    cartillaDiv.style.width = cartillaWidth;

    const cartillaH2 = document.createElement("h2");
    cartillaH2.textContent = "Cartilla de Bingo";

    const letrasDiv = document.createElement("div");
    letrasDiv.classList.add("letras");

    const letras = ["B", "I", "N", "G", "O"];

    letras.forEach((letra) => {
      const letraDiv = document.createElement("div");
      letraDiv.classList.add("letra");
      letraDiv.innerHTML = `<h3>${letra}</h3><ul id="cartilla-${letra.toLowerCase()}">${generarNumerosCartilla(
        letra
      )}</ul>`;
      letrasDiv.appendChild(letraDiv);
    });

    cartillaDiv.appendChild(cartillaH2);
    cartillaDiv.appendChild(letrasDiv);

    return cartillaDiv;
  };

  const generarNumerosCartilla = (letra) => {
    const numeros = [];
    const rango = {
      B: { min: 1, max: 15 },
      I: { min: 16, max: 30 },
      N: { min: 31, max: 45 },
      G: { min: 46, max: 60 },
      O: { min: 61, max: 75 },
    };

    while (numeros.length < 5) {
      const numero =
        Math.floor(Math.random() * (rango[letra].max - rango[letra].min + 1)) +
        rango[letra].min;
      if (!numeros.includes(numero)) {
        numeros.push(numero);
      }
    }

    return numeros.map((numero) => `<li>${numero}</li>`).join("");
  };

  document
    .getElementById("agregar-cartilla")
    .addEventListener("click", agregarCartilla);

  document.getElementById("iniciar").addEventListener("click", () => {
    if (cartillas.length > 0) {
      if (!juegoIniciado) {
        // Enviar al servidor la solicitud de iniciar el juego
        socket.send(JSON.stringify({ iniciar: true }));
        juegoIniciado = true;
      }
    }
  });

  socket.onopen = (event) => {
    console.log("Conexión con el servidor establecida.");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.cartilla) {
      mostrarCartilla(data.cartilla);
    } else if (data.bola) {
      if (juegoIniciado) {
        actualizarProgreso(data.bola);
        marcarBolaEnCartillas(data.bola);
      }
    }
  };

  socket.onclose = (event) => {
    console.log("Conexión con el servidor cerrada.");
  };

  function mostrarCartilla(cartilla) {
    for (let letra in cartilla) {
      const ul = document.getElementById(`cartilla-${letra.toLowerCase()}`);
      cartilla[letra].forEach((numero) => {
        const li = document.createElement("li");
        li.textContent = numero;
        ul.appendChild(li);
      });
    }
  }

  function actualizarProgreso(bola) {
    const progresoUl = document.getElementById("bolas-seleccionadas");
    const li = document.createElement("li");
    li.textContent = `Bola seleccionada: ${bola}`;
    progresoUl.appendChild(li);
  }

  function marcarBolaEnCartillas(bola) {
    for (let letra in cartilla) {
      const ul = document.getElementById(`cartilla-${letra.toLowerCase()}`);
      const liList = ul.getElementsByTagName("li");

      for (let li of liList) {
        if (li.textContent === bola.substring(1)) {
          li.style.color = "red";
          break; // Detener el bucle una vez que se ha encontrado y marcado la bola
        }
      }
    }

    // Agregar la bola seleccionada al conjunto de números seleccionados
    numerosSeleccionados.add(bola);

    // Verificar si se ha completado el juego
    if (verificarCartillasCompletas()) {
      mostrarMensaje("¡El juego de Bingo ha concluido!");
      juegoIniciado = false; // Detener el juego al completarse
    }
  }

  function mostrarMensaje(mensaje) {
    alert(mensaje);
  }

  function verificarCartillasCompletas() {
    for (let letra in cartilla) {
      const ul = document.getElementById(`cartilla-${letra.toLowerCase()}`);
      const liList = ul.getElementsByTagName("li");

      const columnaCompleta = Array.from(liList).every((li) => {
        return li.style.color === "red";
      });

      if (columnaCompleta) {
        return true;
      }
    }

    // Verificar filas
    const letras = ["B", "I", "N", "G", "O"];
    for (let letra of letras) {
      const ulList = document.querySelectorAll(
        `#cartilla-${letra.toLowerCase()} li`
      );

      for (let i = 0; i < 5; i++) {
        const filaCompleta = Array.from(ulList).every((li, index) => {
          return li.style.color === "red" || index === i;
        });

        if (filaCompleta) {
          return true;
        }
      }
    }

    return false;
  }
});
