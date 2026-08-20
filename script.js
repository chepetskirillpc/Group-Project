const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

function search() {
    const query = searchInput.value.trim();

    if (!query) {
        searchInput.focus();
        return;
    }

    console.log("Search:", query);

    ;
}

searchButton.addEventListener("click", search);

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        search();
    }
});