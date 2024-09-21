import { getStarredFilesForDomain, setStarredFilesForDomain } from "./storage";

const star_svg = atob("PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBjbGFzcz0ic2l6ZS02Ij4KICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xMS40OCAzLjQ5OWEuNTYyLjU2MiAwIDAgMSAxLjA0IDBsMi4xMjUgNS4xMTFhLjU2My41NjMgMCAwIDAgLjQ3NS4zNDVsNS41MTguNDQyYy40OTkuMDQuNzAxLjY2My4zMjEuOTg4bC00LjIwNCAzLjYwMmEuNTYzLjU2MyAwIDAgMC0uMTgyLjU1N2wxLjI4NSA1LjM4NWEuNTYyLjU2MiAwIDAgMS0uODQuNjFsLTQuNzI1LTIuODg1YS41NjIuNTYyIDAgMCAwLS41ODYgMEw2Ljk4MiAyMC41NGEuNTYyLjU2MiAwIDAgMS0uODQtLjYxbDEuMjg1LTUuMzg2YS41NjIuNTYyIDAgMCAwLS4xODItLjU1N2wtNC4yMDQtMy42MDJhLjU2Mi41NjIgMCAwIDEgLjMyMS0uOTg4bDUuNTE4LS40NDJhLjU2My41NjMgMCAwIDAgLjQ3NS0uMzQ1TDExLjQ4IDMuNVoiIC8+Cjwvc3ZnPg==")

export async function populateStarredFiles(iserv: string) {
    let files = await getStarredFilesForDomain(iserv);
    const starred_list = document.getElementById('starred_files') as HTMLUListElement;

    for (const file of files) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" class="star-toggle active" data-path="${file.path}">${star_svg}</a> <a href="https://${file.path}">${file.name}</a>`;
        const star = li.querySelector('.star-toggle') as HTMLAnchorElement;
        star.addEventListener('click', async (e) => {
            e.preventDefault();
            const path = star.getAttribute('data-path') as string;
            const starred = star.classList.toggle('active');
            if (starred) {
                files.push({ path, name: file.name });
            } else {
                files = files.filter((f) => f.path !== path);
            }
            console.log(files);
            await setStarredFilesForDomain(iserv, files);
        });

        starred_list.appendChild(li);
    }
}