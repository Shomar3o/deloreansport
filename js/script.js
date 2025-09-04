// Configuración
const SHEET_ID = "18SBf_CjjlFCS7nSkh7do2yExTrTvTqs8Bq-msu-sR5M";
const SHEET_NAME = "Products";
const WHATSAPP_NUMBER = "5217229087294";
let allProducts = [];

// URLs alternativas para probar
const SHEET_URLS = [
    `https://corsproxy.io/?https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`,
    `https://api.allorigins.win/raw?url=https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`
];



function convertGoogleDriveLink(url) {
    if (!url || typeof url !== "string") {
        console.log("⚠️ URL vacía o inválida:", url);
        return "img/placeholder.jpg";
    }

    console.log("🖼️ URL original desde Sheets:", url);

    // Limpiar la URL de espacios en blanco y caracteres especiales
    url = url.trim();

    // Si ya es una URL directa a una imagen
    if (url.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)) {
        console.log("✅ URL ya es directa:", url);
        return url;
    }

    // Si es un ID de Google Drive (solo caracteres alfanuméricos, guiones y guiones bajos)
    if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) {
        const directUrl = `https://drive.google.com/uc?export=view&id=${url}`;
        console.log("🔑 Detectado ID directo:", directUrl);
        return directUrl;
    }

    // PATRÓN PRINCIPAL: URLs con formato /file/d/ID/ (funciona con tu URL)
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
        const directUrl = `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
        console.log("📂 Convertido desde /file/d/:", directUrl);
        return directUrl;
    }

    // URLs más genéricas con /d/
    const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) {
        const directUrl = `https://drive.google.com/uc?export=view&id=${dMatch[1]}`;
        console.log("📂 Convertido desde /d/:", directUrl);
        return directUrl;
    }

    // URLs con parámetro id=
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
        const directUrl = `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
        console.log("📂 Convertido desde id=:", directUrl);
        return directUrl;
    }

    // URLs de vista previa (backup por si acaso)
    if (url.includes('drive.google.com')) {
        const previewMatch = url.match(/\/([a-zA-Z0-9_-]{25,})/);
        if (previewMatch && previewMatch[1]) {
            const directUrl = `https://drive.google.com/uc?export=view&id=${previewMatch[1]}`;
            console.log("📂 Convertido desde vista previa:", directUrl);
            return directUrl;
        }
    }

    console.log("❌ No se pudo reconocer la URL:", url);
    return "img/placeholder.jpg";
}

// Función de prueba para verificar tu URL específica
function testYourURL() {
    const testURL = "https://drive.google.com/file/d/1hNQXAO554qK2iBeweh3tI7gHFREzKxD5/view?usp=drive_link";
    const result = convertGoogleDriveLink(testURL);
    console.log("🧪 Resultado de la prueba:", result);
    
    // Debería devolver: https://drive.google.com/uc?export=view&id=1hNQXAO554qK2iBeweh3tI7gHFREzKxD5
    
    // Probar si la imagen se carga
    const img = new Image();
    img.onload = function() {
        console.log("✅ Imagen de prueba cargada correctamente");
    };
    img.onerror = function() {
        console.log("❌ Error al cargar imagen de prueba");
    };
    img.src = result;
}

// Función mejorada para verificar imágenes con más detalle
function verifyImageWithDetails(url, productName, index) {
    const img = new Image();
    
    img.onload = function() {
        console.log(`✅ Imagen ${index + 1} (${productName}) cargada exitosamente:`);
        console.log(`   📐 Dimensiones: ${this.naturalWidth}x${this.naturalHeight}px`);
        console.log(`   🔗 URL: ${url}`);
    };
    
    img.onerror = function(error) {
        console.log(`❌ Imagen ${index + 1} (${productName}) falló al cargar:`);
        console.log(`   🔗 URL: ${url}`);
        console.log(`   ⚠️ Error:`, error);
        
        // Intentar con diferentes formatos
        const id = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (id) {
            const alternativeUrls = [
                `https://drive.google.com/thumbnail?id=${id[1]}&sz=w400-h400`,
                `https://lh3.googleusercontent.com/d/${id[1]}`,
                `https://drive.google.com/uc?export=download&id=${id[1]}`
            ];
            
            console.log(`🔄 URLs alternativas para probar:`, alternativeUrls);
        }
    };
    
    img.src = url;
}


// Convertir CSV a JSON
function csvToJson(csv) {
    try {
        console.log('📋 CSV original:', csv.substring(0, 200));
        
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            console.log('❌ CSV tiene muy pocas líneas');
            return [];
        }
        
        // Limpiar encabezados
        const headers = lines[0].split(',').map(h => {
            let header = h.trim().replace(/"/g, '');
            // Normalizar nombres de encabezados
            if (header === 'Nombre del Producto') return 'Nombre';
            if (header === 'Oferta (Si/No)') return 'Oferta';
            return header;
        });
        
        console.log('📝 Encabezados normalizados:', headers);
        
        const products = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
            // Manejar comas dentro de campos entre comillas
            const values = [];
            let inQuotes = false;
            let currentValue = '';
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim().replace(/"/g, ''));
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim().replace(/"/g, ''));
            
            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index] || '';
            });
            
            // Solo agregar si tiene ID y Nombre
            if (product.ID && product.Nombre) {
                products.push(product);
            }
        }
        
        console.log('✅ Productos parseados correctamente:', products);
        return products;
        
    } catch (error) {
        console.error('❌ Error parsing CSV:', error);
        return [];
    }
}

// Intentar cargar con diferentes proxies
async function tryLoadFromSheets() {
    for (const url of SHEET_URLS) {
        try {
            console.log('🔗 Probando URL:', url);
            const response = await fetch(url, {
                headers: {
                    'Accept': 'text/csv'
                }
            });
            
            if (!response.ok) {
                console.log(`❌ HTTP error: ${response.status}`);
                continue;
            }
            
            const csvData = await response.text();
            console.log('📄 CSV recibido:', csvData.substring(0, 100) + '...');
            
            if (!csvData || csvData.trim().length < 10) {
                console.log('❌ CSV vacío o muy corto');
                continue;
            }
            
            const products = csvToJson(csvData);
            console.log('📊 Productos parseados:', products.length);
            
            if (products.length > 0) {
                return products;
            }
            
        } catch (error) {
            console.log(`❌ Error con URL ${url}:`, error.message);
        }
    }
    return null;
}

// Cargar productos
async function loadProducts() {
    console.log('🔄 Cargando productos...');
    
    try {
        const sheetProducts = await tryLoadFromSheets();
        
        if (sheetProducts && sheetProducts.length > 0) {
            allProducts = sheetProducts.map(product => ({
                id: product.ID || '',
                nombre: product.Nombre || product['Nombre del Producto'] || 'Sin nombre',
                precio: product.Precio || '0',
                precioOriginal: product['Precio original'] || '',
                talla: product.Talla || '',
                imagen: convertGoogleDriveLink(product.Imagen),
                oferta: product.Oferta === 'Sí' || 
                        product.Oferta === 'si' || 
                        product.Oferta === 'Si' ||
                        product.Oferta === 'S' ||
                        product.Oferta === 'TRUE' ||
                        product.Oferta === 'True' ||
                        product.Oferta === 'true'
            }));
            
            console.log('✅ Productos mapeados:', allProducts);
        }else {
            console.log('📋 Usando datos de ejemplo (Sheets no disponible)');
            useSampleData();
        }
        
        console.log('🔍 Verificación de imágenes:');
        
        allProducts.forEach((product, index) => {
            verifyImageWithDetails(product.imagen, product.nombre, index);
        });
        
        /*
        allProducts.forEach((product, index) => {
            const img = new Image();
            img.onload = function() {
                console.log(`✅ Imagen ${index + 1} cargada: ${product.imagen}`);
            };
            img.onerror = function() {
                console.log(`❌ Imagen ${index + 1} falló: ${product.imagen}`);
            };
            img.src = product.imagen;
        });*/

        renderContent();
        
    } catch (error) {
        console.error('❌ Error general:', error);
        useSampleData();
    }
}


// Renderizar contenido
function renderContent() {
    console.log('🎨 Renderizando contenido...');
    
    if (document.getElementById('catalogo')) {
        renderCatalog(allProducts);
        if (allProducts.length > 0) {
            setupSizeFilters(allProducts);
        }
    }
    
    if (document.getElementById('ofertas')) {
        renderOffers(allProducts);
    }
}

// Renderizar catálogo
function renderCatalog(products) {
    const container = document.getElementById('catalogo');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="color: var(--muted);">No hay productos disponibles.</p>
                <button onclick="location.reload()" class="btn" style="margin-top: 15px;">
                    🔄 Recargar
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card ${product.oferta ? 'offer' : ''}">
            ${product.oferta ? '<span class="badge badge--danger">🔥 Oferta</span>' : ''}
            <div class="product-media">
                <img src="${product.imagen}" alt="${product.nombre}" loading="lazy" 
     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBlbmNvbnRyYWRhPC90ZXh0Pjwvc3ZnPg=='"
     style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-body">
                <h3 class="product-title">${product.nombre}</h3>
                <div class="product-meta">
                    <span>Talla: ${product.talla}</span>
                </div>
                <div class="product-price">
                    ${product.precioOriginal ? `<s>$${product.precioOriginal}</s>` : ''}
                    $${product.precio}
                </div>
                <div class="product-actions">
                    <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, me interesa: ${product.nombre} | Talla: ${product.talla} | Precio: $${product.precio}`)}" 
                       class="whatsapp-btn" target="_blank">
                        💬 Comprar
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Renderizar ofertas (similar pero solo productos con oferta)
function renderOffers(products) {
    const offers = products.filter(product => product.oferta);
    const container = document.getElementById('ofertas');
    if (!container) return;
    
    if (offers.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="color: var(--muted);">No hay ofertas disponibles.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = offers.map(product => `
        <div class="product-card offer">
            <span class="badge badge--danger">🔥 Oferta</span>
            <div class="product-media">
                <img src="${product.imagen}" alt="${product.nombre}" loading="lazy" 
     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBlbmNvbnRyYWRhPC90ZXh0Pjwvc3ZnPg=='"
     style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="product-body">
                <h3 class="product-title">${product.nombre}</h3>
                <div class="product-meta">
                    <span>Talla: ${product.talla}</span>
                </div>
                <div class="product-price">
                    ${product.precioOriginal ? `<s>$${product.precioOriginal}</s>` : ''}
                    $${product.precio}
                </div>
                <div class="product-actions">
                    <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, me interesa la OFERTA: ${product.nombre} | Talla: ${product.talla} | Precio: $${product.precio}`)}" 
                       class="whatsapp-btn" target="_blank">
                        💬 Comprar Oferta
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Configurar filtros
function setupSizeFilters(products) {
    const filterContainer = document.getElementById('filtros-tallas');
    if (!filterContainer) return;
    
    const sizes = [...new Set(products.map(p => p.talla))].filter(Boolean).sort((a, b) => a - b);
    
    if (sizes.length === 0) {
        filterContainer.innerHTML = '<p style="color: var(--muted);">No hay tallas disponibles</p>';
        return;
    }
    
    filterContainer.innerHTML = `
        <button class="filter-pill is-active" data-size="all">
            👟 Todas (${products.length})
        </button>
        ${sizes.map(size => `
            <button class="filter-pill" data-size="${size}">
                Talla ${size} (${products.filter(p => p.talla === size).length})
            </button>
        `).join('')}
    `;
    
    filterContainer.querySelectorAll('.filter-pill').forEach(button => {
        button.addEventListener('click', () => {
            filterContainer.querySelectorAll('.filter-pill').forEach(btn => {
                btn.classList.remove('is-active');
            });
            button.classList.add('is-active');
            
            const size = button.dataset.size;
            if (size === 'all') {
                renderCatalog(allProducts);
            } else {
                const filtered = allProducts.filter(product => product.talla === size);
                renderCatalog(filtered);
            }
        });
    });
}

// Iniciar
document.addEventListener('DOMContentLoaded', loadProducts);