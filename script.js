class MovieExplorer {
    constructor() {
        this.apiKey = "Key_Here"; 
        this.baseUrl = "https://api.themoviedb.org/3";
        this.imageBaseUrl = "https://image.tmdb.org/t/p/w500";
        this.fallbackImageUrl =
            "https://via.placeholder.com/500x750?text=No+Image";

        this.genres = {};
        this.movies = [];
        this.filteredMovies = [];

        this.init();
    }

    async init() {
        await this.fetchGenres();
        this.populateYears();
        await this.loadTrendingMovies();
        await this.loadDiscoverMovies();
        this.attachEvents();
    }

    // Fetch movie genres
    async fetchGenres() {
        try {
            const response = await fetch(
                `${this.baseUrl}/genre/movie/list?api_key=${this.apiKey}`
            );

            const data = await response.json();

            data.genres.forEach((genre) => {
                this.genres[genre.id] = genre.name;

                document.getElementById("genre-select").innerHTML += `
                    <option value="${genre.id}">
                        ${genre.name}
                    </option>
                `;
            });
        } catch (error) {
            console.error("Genre Fetch Error:", error);
        }
    }

    // Populate year dropdown
    populateYears() {
        const yearSelect = document.getElementById("year-select");
        const currentYear = new Date().getFullYear();

        for (let year = currentYear; year >= 1980; year--) {
            yearSelect.innerHTML += `
                <option value="${year}">
                    ${year}
                </option>
            `;
        }
    }

    async loadTrendingMovies() {
        try {
            const response = await fetch(
                `${this.baseUrl}/trending/movie/week?api_key=${this.apiKey}`
            );

            const data = await response.json();
            this.displayTrendingMovies(data.results.slice(0, 10));
        } catch (error) {
            console.error("Trending Error:", error);
        }
    }

    displayTrendingMovies(movies) {
        const container = document.getElementById("trendingContainer");

        container.innerHTML = movies
            .map((movie) => this.createMovieCard(movie))
            .join("");

        this.attachMovieCardEvents();
    }

    async loadDiscoverMovies() {
        try {
            const response = await fetch(
                `${this.baseUrl}/discover/movie?api_key=${this.apiKey}&sort_by=popularity.desc&page=1`
            );

            const data = await response.json();

            this.movies = data.results;
            this.filteredMovies = [...this.movies];

            this.displayMovies(this.movies);
        } catch (error) {
            console.error("Movie Load Error:", error);
        }
    }

    displayMovies(movies) {
        const movieGrid = document.getElementById("movieGrid");

        movieGrid.innerHTML = movies
            .map((movie) => this.createMovieCard(movie))
            .join("");

        this.attachMovieCardEvents();
    }

    createMovieCard(movie) {
        const posterUrl = movie.poster_path
            ? `${this.imageBaseUrl}${movie.poster_path}`
            : this.fallbackImageUrl;

        return `
            <div class="movie-card" data-id="${movie.id}">
                <img src="${posterUrl}" alt="${movie.title}">
                <div class="overlay">
                    <h3>${movie.title}</h3>
                    <p>⭐ ${movie.vote_average.toFixed(1)}</p>
                </div>
            </div>
        `;
    }

    attachMovieCardEvents() {
        document.querySelectorAll(".movie-card").forEach((card) => {
            card.addEventListener("click", async () => {
                const movieId = card.dataset.id;
                await this.showMovieDetails(movieId);
            });
        });
    }

    async showMovieDetails(movieId) {
        try {
            const response = await fetch(
                `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}`
            );

            const movie = await response.json();

            document.getElementById("modalPoster").src =
                movie.poster_path
                    ? `${this.imageBaseUrl}${movie.poster_path}`
                    : this.fallbackImageUrl;

            document.getElementById("modalTitle").textContent = movie.title;
            document.getElementById(
                "modalYear"
            ).textContent = `Release Date: ${movie.release_date}`;

            document.getElementById(
                "modalRating"
            ).textContent = `⭐ ${movie.vote_average}`;

            document.getElementById("modalOverview").textContent =
                movie.overview;

            document.getElementById("movieModal").style.display = "flex";
        } catch (error) {
            console.error("Movie Details Error:", error);
        }
    }

    searchMovies(query) {
        query = query.toLowerCase();

        const filtered = this.filteredMovies.filter((movie) =>
            movie.title.toLowerCase().includes(query)
        );

        this.displayMovies(filtered);
    }

    applyFilters() {
        let movies = [...this.movies];

        const genre = document.getElementById("genre-select").value;
        const year = document.getElementById("year-select").value;
        const sort = document.getElementById("sort-select").value;

        if (genre) {
            movies = movies.filter((movie) =>
                movie.genre_ids.includes(Number(genre))
            );
        }

        if (year) {
            movies = movies.filter(
                (movie) =>
                    movie.release_date &&
                    movie.release_date.startsWith(year)
            );
        }

        switch (sort) {
            case "rating":
                movies.sort((a, b) => b.vote_average - a.vote_average);
                break;

            case "year":
                movies.sort(
                    (a, b) =>
                        new Date(b.release_date) -
                        new Date(a.release_date)
                );
                break;

            case "popularity":
                movies.sort((a, b) => b.popularity - a.popularity);
                break;

            case "asc":
                movies.sort((a, b) =>
                    a.title.localeCompare(b.title)
                );
                break;
        }

        this.filteredMovies = movies;
        this.displayMovies(movies);
    }

    clearFilters() {
        document.getElementById("search-input").value = "";
        document.getElementById("genre-select").value = "";
        document.getElementById("year-select").value = "";
        document.getElementById("sort-select").value = "";

        this.filteredMovies = [...this.movies];
        this.displayMovies(this.filteredMovies);
    }

    attachEvents() {
        document
            .getElementById("search-input")
            .addEventListener("input", (e) => {
                this.searchMovies(e.target.value);
            });

        document
            .getElementById("genre-select")
            .addEventListener("change", () => this.applyFilters());

        document
            .getElementById("year-select")
            .addEventListener("change", () => this.applyFilters());

        document
            .getElementById("sort-select")
            .addEventListener("change", () => this.applyFilters());

        document
            .getElementById("clear-filters")
            .addEventListener("click", () => this.clearFilters());

        document
            .querySelector(".close-modal")
            .addEventListener("click", () => {
                document.getElementById("movieModal").style.display = "none";
            });

        window.addEventListener("click", (e) => {
            const modal = document.getElementById("movieModal");

            if (e.target === modal) {
                modal.style.display = "none";
            }
        });

        document
            .getElementById("trendingNext")
            .addEventListener("click", () => {
                document.getElementById("trendingContainer").scrollBy({
                    left: 800,
                    behavior: "smooth"
                });
            });

        document
            .getElementById("trendingPrev")
            .addEventListener("click", () => {
                document.getElementById("trendingContainer").scrollBy({
                    left: -800,
                    behavior: "smooth"
                });
            });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new MovieExplorer();
});