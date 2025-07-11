import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Cargar variables de entorno desde .env
dotenv.config();

const TOKEN = process.env.ACCES_GH_TOKEN;

// Configuración de caché
const CACHE_FILE_PATH = "./src/data/github-repos.json";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

// Función para verificar si la caché es válida
function isCacheValid() {
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      return false;
    }
    const stats = fs.statSync(CACHE_FILE_PATH);
    const cacheAge = Date.now() - stats.mtimeMs;
    return cacheAge < CACHE_TTL && stats.size > 2; // Asegurarse de que el archivo no esté vacío (más de 2 bytes)
  } catch (error) {
    console.error("Error verificando la caché:", error);
    return false;
  }
}

// Función para leer datos de la caché
function readFromCache() {
  try {
    const data = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Si el formato incluye metadata, devolver solo los repos
    if (parsedData && parsedData.repos !== undefined) {
      return parsedData.repos;
    }
    
    // Si es un formato antiguo (array directo), devolverlo tal cual
    return parsedData;
  } catch (error) {
    console.error("Error leyendo la caché:", error);
    return null;
  }
}

// Función para escribir datos en la caché
function writeToCache(data) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE_PATH), { recursive: true });
    
    // Crear un objeto con metadata para asegurar que el archivo no esté vacío
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
  // Obtener username de las variables de entorno o usar el valor predeterminado
  const username = process.env.GITHUB_USERNAME || "chrisladzamach";
  
  // Configurar opciones de fetch con el token
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
      
      // Verificar respuesta HTTP
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error en respuesta HTTP: ${res.status} ${res.statusText}`);
        console.error(`Detalles: ${errorText}`);
        break;
      }
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        fetched = data;
        // Filtramos para mostrar solo repositorios con descripción
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

// Función principal que implementa la lógica de caché
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
    
    // Si hay un error pero tenemos caché (incluso expirada), la usamos como fallback
    if (fs.existsSync(CACHE_FILE_PATH)) {
      console.log("Usando caché expirada como fallback debido al error...");
      return readFromCache() || [];
    }
    
    // Si no hay caché, devolvemos un array vacío
    return [];
  }
}

// Ejecutar la función principal
getRepos().then(repos => {
  console.log(`Se obtuvieron ${repos.length} repositorios`);
  // Los datos ya se han guardado en el archivo de caché en la función writeToCache
});
