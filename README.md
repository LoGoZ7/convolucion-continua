# Convolución continua — presentación interactiva

Proyecto didáctico de **Señales y Sistemas** realizado exclusivamente con HTML, CSS y JavaScript. Funciona **sin Internet, sin bibliotecas, sin instalaciones y sin compilación**.

## Cómo ejecutarlo

1. Descomprimir el archivo ZIP si se recibió comprimido.
2. Abrir `index.html` con Chrome, Firefox, Edge u otro navegador moderno.
3. Navegar usando los botones de la parte inferior o las flechas izquierda/derecha.
4. Experimentar con los controles deslizantes y los botones **Reproducir**.

**Importante:** conservar `index.html`, `styles.css` y `app.js` en la misma carpeta. No es necesario usar `npm`, `pip`, servidor local ni instalar paquetes.

## Contenido (11 pantallas)

| # | Tema | Interacción |
|---|---|---|
| 1 | Introducción | Gráfico animado |
| 2 | Intuición y sistemas LTI | Diagrama visual |
| 3 | Definición matemática | Reflejar, desplazar, multiplicar e integrar |
| 4 | Convolución de dos pulsos | Tiempo variable, área de solapamiento, reproducir/pausar |
| 5 | Solución exacta por tramos | Gráfica trapezoidal |
| 6 | Explorar anchos de pulsos | Ajustar ambas duraciones y el tiempo |
| 7 | Escalón y filtro RC | Ajustar constante de tiempo y tiempo, reproducir/pausar |
| 8 | Pulso transmitido por un canal | Duración del pulso y constante del sistema |
| 9 | Propiedades de la convolución | Identidades y causalidad |
| 10 | Mini reto | Tres preguntas con corrección inmediata |
| 11 | Síntesis | Regreso a los laboratorios |

## Atajos

- `←` / `→`: cambiar diapositiva.
- `Espacio`: reproducir/pausar en los dos laboratorios animados; avanzar en otras pantallas.
- `F`: activar o desactivar pantalla completa (si el navegador lo permite).
- `?` en la esquina superior: ayuda.

## Modelo matemático

La convolución continua de dos señales es:

`y(t) = ∫_{−∞}^{∞} x(τ) h(t−τ) dτ`

### Ejemplo 1: pulsos rectangulares

- `x(t) = 1` para `0 ≤ t < a`, y cero fuera de ese intervalo.
- `h(t) = 1` para `0 ≤ t < b`, y cero fuera de ese intervalo.
- `y(t) = max(0, min(a,t) − max(0,t−b))`.
- Para `a=2, b=1`, la salida vale:
  - `0` si `t<0`.
  - `t` si `0≤t<1`.
  - `1` si `1≤t<2`.
  - `3−t` si `2≤t<3`.
  - `0` si `t≥3`.

### Ejemplo 2: sistema RC normalizado

- Entrada `x(t)=u(t)`.
- Respuesta al impulso `h(t)=(1/Tc) exp(−t/Tc) u(t)`.
- Respuesta al escalón `y(t)=(1−exp(−t/Tc))u(t)`.

### Ejemplo 3: canal de primer orden

- Pulso transmitido `x(t)=u(t)−u(t−D)`.
- Respuesta recibida:
  `y(t)=(1−exp(−t/Tc))u(t) − (1−exp(−(t−D)/Tc))u(t−D)`.

Las funciones de graficación se calculan y dibujan mediante **Canvas 2D**, en tiempo real, sin imágenes precalculadas.

## Archivos

- `index.html`: estructura semántica, contenido de las 11 diapositivas y controles.
- `styles.css`: diseño adaptable, transiciones y temas visuales.
- `app.js`: navegación, motor de gráficas, animaciones, fórmulas y autoevaluación.
- `README.md`: instalación, funcionamiento y explicación.
