import asyncio
import random
import websockets
import json

# Configuración del servidor
host = 'localhost'
port = 12345

# Lista para mantener a los clientes conectados
clientes = set()

# Genera una cartilla de Bingo para un cliente
def generar_cartilla():
    cartilla = {}
    letras = ['B', 'I', 'N', 'G', 'O']
    rango_letras = {'B': (1, 15), 'I': (16, 30), 'N': (31, 45), 'G': (46, 60), 'O': (61, 75)}

    for letra in letras:
        cartilla[letra] = random.sample(range(rango_letras[letra][0], rango_letras[letra][1] + 1), 5)

    return cartilla

# Genera una bola de Bingo única
def generar_bola(bolas_seleccionadas):
    letra = random.choice(['B', 'I', 'N', 'G', 'O'])
    rango = {'B': (1, 15), 'I': (16, 30), 'N': (31, 45), 'G': (46, 60), 'O': (61, 75)}

    while True:
        numero = random.randint(rango[letra][0], rango[letra][1])
        bola = f"{letra}{numero}"
        if bola not in bolas_seleccionadas:
            return bola

# Función para manejar a un cliente
async def manejar_cliente(websocket, path):
    # Agrega el cliente a la lista
    clientes.add(websocket)

    # Genera una cartilla para el cliente
    cartilla = generar_cartilla()
    await websocket.send(json.dumps({"cartilla": cartilla}))

    bolas_seleccionadas = set()

    try:
        while True:
            # Genera una bola de Bingo única
            bola = generar_bola(bolas_seleccionadas)

            # Agrega la bola a las seleccionadas
            bolas_seleccionadas.add(bola)

            # Envía la bola a todos los clientes
            for client in clientes:
                await client.send(json.dumps({"bola": bola}))

            # Simula un retraso antes de enviar la siguiente bola
            await asyncio.sleep(5)

    except websockets.exceptions.ConnectionClosed:
        # Cliente desconectado
        clientes.remove(websocket)

# Configura el servidor WebSocket
start_server = websockets.serve(manejar_cliente, host, port)

# Inicia el servidor
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

