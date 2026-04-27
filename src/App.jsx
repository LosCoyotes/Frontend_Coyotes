import { useState, useEffect } from 'react'
import './App.css' // ¡Aquí conectamos el archivo de diseño!

function App() {
  const [vistaActual, setVistaActual] = useState("catalogo")
  const [busqueda, setBusqueda] = useState("")

  const [zapatos, setZapatos] = useState([])
  const [archivados, setArchivados] = useState([])   //Para ver los descontinuados
  const [cargando, setCargando] = useState(true)

  const [modoEdicion, setModoEdicion] = useState(false)
  const [idEditando, setIdEditando] = useState(null)

  // Formulario
  const [formulario, setFormulario] = useState({
    nombre: "",
    categoria: '',
    marca: "",
    talla: "",
    color: "",
    precio: "",
    stock: ""
  })

  const [guardando, setGuardando] = useState(false)

  // Función para obtener el catálogo
  const getCatalogo = async () => {
    try {
      const respuesta = await fetch("https://backend-coyotes.onrender.com/zapatos");
      const datos = await respuesta.json();
      if (datos.estado === "Éxito") {
        setZapatos(datos.catalogo);
      }
      setCargando(false)
    } catch (error) {
      console.error("Error al conectar:", error)
      setCargando(false)
    }
  }


  // NUEVA FUNCIÓN: Traer los archivados
  const getArchivados = async () => {
    try {
      const res = await fetch("https://backend-coyotes.onrender.com/zapatos/archivados");
      const datos = await res.json();
      if (datos.estado === "Éxito") setArchivados(datos.archivados || []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    setCargando(true);
    if (vistaActual === "catalogo") {
      getCatalogo().then(() => setCargando(false));
    } else {
      getArchivados().then(() => setCargando(false));
    }
  }, [vistaActual]) // React vigila "vistaActual". Si cambia, vuelve a ejecutar esto.

  //Actualizar el formulario en tiempo real
  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  //Prepara para editar
  const iniciarEdicion = (zapato) => {
    setModoEdicion(true);
    setIdEditando(zapato.codigo);
    // Copiamos los datos del zapato a la caja de texto
    setFormulario({
      nombre: zapato.nombre,
      categoria: zapato.categoria,
      marca: zapato.marca,
      talla: zapato.talla,
      color: zapato.color,
      precio: zapato.precio,
      stock: zapato.stock
    });
    // Hacemos scroll hacia arriba para que el usuario vea el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // NUEVA FUNCIÓN: Cancela la edición y limpia el formulario
  const cancelarEdicion = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormulario({ nombre: "", categoria: "", marca: "", talla: "", color: "", precio: "", stock: "" });
  }

  //Guardar ambas tablas
  const saveNewZapato = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (modoEdicion) {
        // --- RUTA DE ACTUALIZAR (PUT) ---
        const resActualizar = await fetch(`https://backend-coyotes.onrender.com/zapatos/actualizar/${idEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formulario.nombre,
            categoria: formulario.categoria,
            marca: formulario.marca,
            talla: formulario.talla,
            color: formulario.color,
            precio: parseFloat(formulario.precio),
            stock: parseInt(formulario.stock)
          })
        });

        const data = await resActualizar.json();
        if (data.estado === "Éxito") {
          alert("¡Zapato actualizado correctamente!");
          getCatalogo();
          cancelarEdicion(); // Limpiamos todo
        } else {
          alert(data.mensaje);
        }

      } else {
        // --- RUTA DE CREAR (POST) --- (Tu código original)
        const resModelo = await fetch("https://backend-coyotes.onrender.com/modelos", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: formulario.nombre, categoria: formulario.categoria, marca: formulario.marca })
        });
        const dataModelo = await resModelo.json();

        if (dataModelo.estado === "Éxito") {
          const resVariante = await fetch("https://backend-coyotes.onrender.com/zapatos", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modelo_id: dataModelo.id_modelo, talla: formulario.talla, color: formulario.color,
              precio: parseFloat(formulario.precio), stock: parseInt(formulario.stock)
            })
          });
          const dataVariante = await resVariante.json();

          if (dataVariante.estado === "Éxito") {
            alert("¡Zapato guardado correctamente!");
            getCatalogo();
            setFormulario({ nombre: "", categoria: "", marca: "", talla: "", color: "", precio: "", stock: "" });
          }
        }
      }
    } catch (error) {
      alert("Hubo un error al guardar: " + error.message);
    } finally {
      setGuardando(false);
    }
  }

  const descontinuarZapato = async (id_variante) => {
    // Es buena práctica pedir confirmación antes de una acción destructiva
    const confirmar = window.confirm("¿Estás seguro de que quieres descontinuar este producto? Desaparecerá del catálogo principal.");

    if (confirmar) {
      try {
        // Hacemos el llamado a tu backend, método PUT
        const respuesta = await fetch(`https://backend-coyotes.onrender.com/zapatos/descontinuar/${id_variante}`, {
          method: "PUT"
        });
        const datos = await respuesta.json();

        if (datos.estado === "Éxito") {
          // Si Python confirma que todo salió bien, actualizamos la tabla
          getCatalogo();
        } else {
          alert(datos.mensaje);
        }
      } catch (error) {
        alert("Error al intentar descontinuar: " + error.message);
      }
    }
  }

  const registrarVenta = async (id_variante) => {
    try {
      const respuesta = await fetch(`https://backend-coyotes.onrender.com/zapatos/vender/${id_variante}`, {
        method: "PUT"
      });
      const datos = await respuesta.json();
      alert("Venta Exitosa.")

      if (datos.estado === "Éxito") {
        if (datos.mensaje.includes("descontinuado")) {
          alert(datos.mensaje);
        }
        getCatalogo();
      } else {
        alert(datos.mensaje);
      }
    } catch (error) {
      alert("Error al procesar la venta.");
    }
  }

  //FUNCIÓN Reactivar
  const reactivarZapato = async (id) => {
    await fetch(`https://backend-coyotes.onrender.com/zapatos/${id}/reactivar`, { method: "PATCH" });
    getArchivados();
    getCatalogo();
    alert("¡Producto reactivado! Volverá a aparecer en el catálogo.");
  }

  //FUNCIÓN Eliminar Permanente
  const deletePermanente = async (id) => {
    if (window.confirm("ALERTA: Esta acción borrará el zapato de la base de datos para siempre. ¿Estás absolutamente seguro?")) {
      const res = await fetch(`https://backend-coyotes.onrender.com/zapatos/${id}/permanente`, { method: "DELETE" });
      const datos = await res.json();
      if (datos.estado === "Éxito") {
        getArchivados();
        alert("Zapato destruido.");
      } else {
        alert(datos.mensaje);
      }
    }
  }

  const zapatosFiltrados = zapatos.filter((zapato) => {
    const termino = busqueda.toLowerCase();
    return (
      zapato.nombre.toLowerCase().includes(termino) ||
      zapato.marca.toLowerCase().includes(termino) ||
      zapato.categoria.toLowerCase().includes(termino) ||
      zapato.codigo.toString().includes(termino) // Buscar por ID
    );
  });

  return (
    <div className="contenedor-principal">
      <h1 className="titulo-panel">Panel Administrativo - Los Coyotes</h1>

      {/* MENÚ SUPERIOR DE PESTAÑAS */}
      <div className="navegacion-panel">
        <button
          className={`boton-pestana ${vistaActual === "catalogo" ? "activa" : ""}`}
          onClick={() => setVistaActual("catalogo")}
        >
          Catálogo Activo
        </button>
        <button
          className={`boton-pestana ${vistaActual === "archivo" ? "activa" : ""}`}
          onClick={() => setVistaActual("archivo")}
        >
          Archivo (Descontinuados)
        </button>
      </div>

      {/* SECCION DE LA TABLA GET (CATALOGO) */}
      {vistaActual === "catalogo" && (
        <>
          <h2>Catálogo de Zapatos en Stock</h2>

          {/*Barra de busqueda*/}
          <div className="contenedor-busqueda">
            <input
              type="text"
              className="input-busqueda"
              placeholder="Buscar por modelo, categoria, marca o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {cargando ? (
            <p>Cargando inventario desde la base de datos...</p>
          ) : (
            <table className="tabla-coyotes">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Modelo</th>
                  <th>Categoria</th>
                  <th>Marca</th>
                  <th>Talla</th>
                  <th>Color</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {zapatosFiltrados.map((zapato) => (
                  <tr key={zapato.codigo}>
                    <td>#{zapato.codigo}</td>
                    <td><strong>{zapato.nombre}</strong></td>
                    <td>{zapato.categoria}</td>
                    <td>{zapato.marca}</td>
                    <td>{zapato.talla}</td>
                    <td>{zapato.color}</td>
                    <td>S/ {zapato.precio.toFixed(2)}</td>
                    <td className={zapato.stock === 0 ? "stock-agotado" : zapato.stock < 5 ? "stock-bajo" : "stock-bien"}>
                      {zapato.stock === 0 ? "AGOTADO" : `${zapato.stock} unid.`}
                    </td>

                    {/* Nueva celda con el botón, le pasamos el ID específico a la función */}
                    <td className="acciones-tabla">
                      <button className="boton-exito" onClick={() => registrarVenta(zapato.codigo)} disabled={zapato.stock === 0} style={{ opacity: zapato.stock === 0 ? 0.5 : 1, cursor: zapato.stock === 0 ? "not-allowed" : "pointer" }}>
                        Vender
                      </button>
                      <button className="boton-primario" onClick={() => iniciarEdicion(zapato)}>
                        Editar
                      </button>
                      <button className="boton-peligro" onClick={() => descontinuarZapato(zapato.codigo)}>
                        Descontinuar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {zapatos.length === 0 && !cargando && (
            <p className="mensaje-vacio">No hay zapatos registrados en el sistema.</p>
          )}

          <br />
          <br />

          {/* --- SECCIÓN DEL FORMULARIO --- */}
          <div className="tarjeta-formulario">
            <h2>Registrar Nuevo Zapato</h2>
            <form onSubmit={saveNewZapato}>
              <div className="cuadricula-formulario">
                <div className="grupo-input">
                  <label>Nombre del Modelo</label>
                  <input type="text" name="nombre" value={formulario.nombre} onChange={manejarCambio} required placeholder="Ej. Zapatilla Runner X" />
                </div>
                <div className="grupo-input">
                  <label>Categoría</label>
                  <select name="categoria" value={formulario.categoria} onChange={manejarCambio} required>
                    <option value="">Seleccione una opción</option>
                    <option value="Zapatillas">Zapatillas</option>
                    <option value="Zapatos casuales">Zapatos casuales</option>
                    <option value="Sandalias">Sandalias</option>
                    <option value="Alpargatas">Alpargatas</option>
                    <option value="Pantuflas">Pantuflas</option>
                  </select>
                </div>
                <div className="grupo-input">
                  <label>Marca</label>
                  <input type="text" name="marca" value={formulario.marca} onChange={manejarCambio} required placeholder="Ej. Nike" />
                </div>
                <div className="grupo-input">
                  <label>Talla</label>
                  <input type="text" name="talla" value={formulario.talla} onChange={manejarCambio} required placeholder="Ej. 42 o 40.5" />
                </div>
                <div className="grupo-input">
                  <label>Color</label>
                  <input type="text" name="color" value={formulario.color} onChange={manejarCambio} required placeholder="Ej. Negro" />
                </div>
                <div className="grupo-input">
                  <label>Precio (S/)</label>
                  <input type="number" step="0.01" name="precio" value={formulario.precio} onChange={manejarCambio} required placeholder="0.00" />
                </div>
                <div className="grupo-input">
                  <label>Stock Inicial</label>
                  <input type="number" name="stock" value={formulario.stock} onChange={manejarCambio} required placeholder="Cantidad" />
                </div>
              </div>
              {/* Reemplaza tu botón <button type="submit"...> actual por este grupo: */}
              <div className="grupo-botones-form">
                <button type="submit" className="boton-guardar" disabled={guardando}>
                  {guardando
                    ? "Procesando..."
                    : modoEdicion
                      ? "Actualizar Producto"
                      : "Guardar Producto en Inventario"}
                </button>

                {/* Solo mostramos el botón Cancelar si estamos editando */}
                {modoEdicion && (
                  <button type="button" className="boton-secundario" onClick={cancelarEdicion}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}

      {/* VISTA: ARCHIVO */}
      {vistaActual === "archivo" && (
        <>
          <h2>Productos Descontinuados</h2>
          <p style={{ color: "gray" }}>Estos productos están ocultos para los clientes. Puedes reactivarlos o borrarlos para siempre.</p>

          {cargando ? <p>Cargando archivo...</p> : (
            <table className="tabla-coyotes" style={{ opacity: "0.9" }}>
              <thead>
                <tr style={{ backgroundColor: "#666" }}>
                  <th>Código</th><th>Modelo</th><th>Categoria</th><th>Marca</th><th>Talla</th>
                  <th>Color</th><th>Precio</th><th>Stock</th><th>Acciones de Recuperación</th>
                </tr>
              </thead>
              <tbody>
                {archivados.map((zapato) => (
                  <tr key={zapato.codigo}>
                    <td>#{zapato.codigo}</td>
                    <td><del>{zapato.nombre}</del></td>
                    <td>{zapato.categoria}</td>
                    <td>{zapato.marca}</td>
                    <td>{zapato.talla}</td>
                    <td>{zapato.color}</td>
                    <td>S/ {zapato.precio.toFixed(2)}</td>
                    <td>{zapato.stock}</td>
                    <td className="acciones-tabla">
                      <button className="boton-exito" onClick={() => reactivarZapato(zapato.codigo)}>
                        Reactivar
                      </button>
                      <button className="boton-peligro-extremo" onClick={() => deletePermanente(zapato.codigo)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {archivados.length === 0 && !cargando && <p className="mensaje-vacio">La papelera está vacía.</p>}
        </>
      )}
    </div>
  )
}

export default App