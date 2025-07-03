function typewriter(element, text, speed = 50, callback = null) {
    let i = 0;
    element.innerHTML = ''; // Clear previous content
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '_';
    element.appendChild(cursor);

    const content = document.createElement('span');
    element.prepend(content);

    function type() {
        if (i < text.length) {
            content.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            cursor.style.animation = 'none'; // Stop blinking
            cursor.style.opacity = '0';
            if (callback) {
                setTimeout(callback, 500); // Small delay before executing callback
            }
        }
    }
    type();
}