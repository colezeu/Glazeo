// @ts-nocheck
import { useEffect } from "react";

/**
 * Actualizează meta tags-urile paginii dinamic
 * Folosit în fiecare pagină/configurător pentru SEO specific
 */
export function SEOHead({ title, description, canonical }) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} — Glass Associates`
      : "Glass Associates — Sticlă Structurală, Balustrade, Cabine Duș";

    document.title = fullTitle;

    // Update meta description
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;

      // OG description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.content = description;

      // Twitter description
      let twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.content = description;
    }

    // OG title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = fullTitle;

    // Twitter title
    let twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = fullTitle;

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (link) link.href = canonical;
    }
  }, [title, description, canonical]);

  return null;
}

// Pagini SEO predefinite
export const SEO_PAGES = {
  home: {
    title: "",
    description: "Configurați online produse din sticlă structurală: balustrade, cabine duș, închidere terase, pergole, copertine, uși, oglinzi. Ofertă instantanee — Glass Associates.",
  },
  balustrade: {
    title: "Configurator Balustrade Sticlă",
    description: "Configurați balustrade din sticlă securizată online. Alegeți tipul de sticlă, feronerie (butoni, mini-montanți, profil), mână curentă și LED. Ofertă instantanee.",
  },
  shower: {
    title: "Configurator Cabine Duș",
    description: "Configurați cabina de duș online. Paravan fix sau mobil, ușă batantă sau culisantă, sticlă 8mm sau 10mm, tratament sablat sau nano. Ofertă instantanee.",
  },
  terrace: {
    title: "Configurator Închidere Terasă",
    description: "Configurați închidere mobilă pentru terasă. Sisteme multitrack, frameless sau ghilotină. Sticlă securizată, profile aluminiu. Ofertă instantanee.",
  },
  partition: {
    title: "Configurator Partiționări Sticlă",
    description: "Configurați partiționări din sticlă pentru birouri și spații comerciale. Simple, caroiaj sau fonoizolante. Cu ușă inclusă.",
  },
  swingDoor: {
    title: "Configurator Uși Batante Sticlă",
    description: "Configurați uși batante din sticlă securit. Simple, pe toc sau fonoizolante. Balamale standard sau soft-close.",
  },
  slidingDoor: {
    title: "Configurator Uși Culisante Sticlă",
    description: "Configurați uși culisante din sticlă. Full glass, buzunar sau sincron. Fără șină jos, cu panou fix opțional.",
  },
  pergola: {
    title: "Configurator Pergole Bioclimatice",
    description: "Configurați pergole bioclimatice cu lamele orientabile. Acoperiș din sticlă culisant sau panou sandwich. Ofertă personalizată.",
  },
  copertina: {
    title: "Configurator Copertine Sticlă",
    description: "Configurați copertine din sticlă securizată. Cu tiranți inox, în consolă sau pe prinderi spider. Ofertă instantanee.",
  },
  oglinzi: {
    title: "Configurator Oglinzi la Comandă",
    description: "Configurați oglinzi la comandă. Clară, bronze, gri sau antichizată. Forme standard sau speciale, cu iluminare LED.",
  },
  vitrovibe: {
    title: "Configurator VitroVibe®",
    description: "Configurați panouri decorative premium VitroVibe®. Sticlă laminată cu textile reale (denim, in, catifea), carbon, ardezie, inserții metalice. Ofertă personalizată — Glass Associates.",
  },
  despre: {
    title: "Despre Noi",
    description: "Glass Associates — peste 18 ani de experiență în sticlă structurală. Peste 2400 de proiecte finalizate.",
  },
  portofoliu: {
    title: "Portofoliu Proiecte",
    description: "Vedeți proiectele noastre finalizate: balustrade, cabine duș, terase, pergole, copertine și partiționări din sticlă.",
  },
  contact: {
    title: "Contact",
    description: "Contactați Glass Associates pentru o ofertă personalizată. Email: office@glassassociates.ro",
  },
};
