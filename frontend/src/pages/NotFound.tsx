import { ButtonLink } from "../components/ui/Button";
import SectionHeading from "../components/ui/SectionHeading";

/** Cualquier ruta que no existe: mismo estilo que el "no encontrado" de la ficha de un sitio */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-12 pb-16">
      <SectionHeading as="h1" title="No encontramos esta página" className="mt-6">
        <p>Puede que el enlace esté mal escrito o que la página ya no exista.</p>
      </SectionHeading>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/">Volver al inicio</ButtonLink>
        <ButtonLink to="/ubicaciones" variant="secondary">
          Ver todas las ubicaciones
        </ButtonLink>
      </div>
    </div>
  );
}
