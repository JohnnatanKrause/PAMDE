document.addEventListener('DOMContentLoaded', function() {
    loadFooter();
});

function loadFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('footer.html') // Caminho para o seu arquivo de footer
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                footerPlaceholder.innerHTML = data;
            })
            .catch(error => {
                console.error("Erro ao carregar o footer:", error);
                footerPlaceholder.innerHTML = "<p style='color:red; text-align:center;'>Erro ao carregar o rodapé.</p>";
            });
    }
}