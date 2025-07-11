import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.ACCES_GH_TOKEN;

const CACHE_FILE_PATH = "./src/data/github-repos.json";
const CACHE_TTL = 24 * 60 * 60 * 1000; 

function isCacheValid() {
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      return false;
    }
    const stats = fs.statSync(CACHE_FILE_PATH);
    const cacheAge = Date.now() - stats.mtimeMs;
    return cacheAge < CACHE_TTL && stats.size > 2;
  } catch (error) {
    console.error("Error verificando la caché:", error);
    return false;
  }
}

function readFromCache() {
  try {
    const data = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
    const parsedData = JSON.parse(data);
    
    if (parsedData && parsedData.repos !== undefined) {
      return parsedData.repos;
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error leyendo la caché:", error);
    return null;
  }
}

function writeToCache(data) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE_PATH), { recursive: true });
    
    const dataToWrite = {
      metadata: {
        timestamp: Date.now(),
        count: data.length
      },
      repos: data
    };
    
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(dataToWrite, null, 2));
    console.log("Datos guardados en caché: " + CACHE_FILE_PATH);
  } catch (error) {
    console.error("Error escribiendo en la caché:", error);
  }
}

async function fetchAllRepos() {
  const username = process.env.GITHUB_USERNAME || "chrisladzamach";
  
  const fetchOptions = {
    headers: {
      'Accept': 'application/vnd.github+json',
      ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
    }
  };

  let page = 1;
  const perPage = 100;
  let allRepos = [];
  let fetched = [];

  console.log(`Obteniendo repositorios para ${username}...`);
  try {
    do {
      const url = `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`;
      console.log(`Consultando: ${url}`);
      
      const res = await fetch(url, fetchOptions);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error en respuesta HTTP: ${res.status} ${res.statusText}`);
        console.error(`Detalles: ${errorText}`);
        break;
      }
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        fetched = data;
        const reposWithDescription = fetched.filter(repo => repo.description);
        allRepos = allRepos.concat(reposWithDescription);
        console.log(`Página ${page}: ${fetched.length} repositorios encontrados, ${reposWithDescription.length} con descripción`);
      } else {
        console.error("La respuesta no es un array:", data);
        break;
      }
      
      page++;
    } while (fetched.length === perPage);

    console.log(`Total de repositorios encontrados: ${allRepos.length}`);
    console.log("Obteniendo información de lenguajes...");

    const reposWithLanguages = await Promise.all(
      allRepos.map(async (repo) => {
        try {
          const langRes = await fetch(repo.languages_url, fetchOptions);
          if (!langRes.ok) {
            console.error(`Error al obtener lenguajes para ${repo.name}: ${langRes.status}`);
            return { ...repo, languages: [] };
          }
          const langs = await langRes.json();
          return { ...repo, languages: Object.keys(langs) };
        } catch (error) {
          console.error(`Error al procesar lenguajes para ${repo.name}:`, error.message);
          return { ...repo, languages: [] };
        }
      })
    );

    return reposWithLanguages;
  } catch (error) {
    console.error("Error al obtener repositorios:", error.message);
    return [];
  }
}

async function getRepos() {
  console.log("Verificando si existe caché válida...");
  
  if (isCacheValid()) {
    console.log("Usando datos en caché...");
    return readFromCache() || [];
  }
  
  console.log("Caché no disponible o expirada, obteniendo datos frescos de GitHub...");
  try {
    const repos = await fetchAllRepos();
    writeToCache(repos);
    return repos;
  } catch (error) {
    console.error("Error obteniendo repos de GitHub:", error);
    
    if (fs.existsSync(CACHE_FILE_PATH)) {
      console.log("Usando caché expirada como fallback debido al error...");
      return readFromCache() || [];
    }
    
    return [];
  }
}

getRepos().then(repos => {
  console.log(`Se obtuvieron ${repos.length} repositorios`);
});
