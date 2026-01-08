import { Mountain, Github, Twitter } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Mountain className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-heading text-lg font-bold">ClimbZone</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Descubre las mejores zonas de escalada con pronósticos meteorológicos en tiempo real.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Explorar</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/zones" className="hover:text-foreground transition-colors">Zonas</Link></li>
              <li><Link href="/zones?type=sport" className="hover:text-foreground transition-colors">Escalada deportiva</Link></li>
              <li><Link href="/zones?type=boulder" className="hover:text-foreground transition-colors">Boulder</Link></li>
              <li><Link href="/zones?type=trad" className="hover:text-foreground transition-colors">Clásica</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://www.thecrag.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">theCrag</a></li>
              <li><a href="https://www.meteoblue.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Meteoblue</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Síguenos</h4>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ClimbZone. Datos de zonas proporcionados por theCrag.</p>
        </div>
      </div>
    </footer>
  );
}




