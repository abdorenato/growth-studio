import type { Progress } from "@/types";

export type NavItem = {
  key: string;
  title: string;
  icon: string;
  href: string;
  locked?: boolean;
  comingSoon?: boolean;
};

export type NavGroup = {
  title: string;
  icon: string;
  items: NavItem[];
};

export function buildNav(progress: Partial<Progress>): NavGroup[] {
  return [
    {
      title: "Início",
      icon: "🏠",
      items: [
        {
          key: "home",
          title: "Dashboard",
          icon: "🏠",
          href: "/dashboard",
        },
      ],
    },
    {
      title: "Conteúdo",
      icon: "✨",
      items: [
        {
          key: "voz",
          title: "Voz da Marca",
          icon: "🎙️",
          href: "/conteudo/voz",
        },
        {
          key: "posicionamento",
          title: "Posicionamento",
          icon: "📍",
          href: "/conteudo/posicionamento",
          comingSoon: true,
        },
        {
          key: "territorio",
          title: "Território",
          icon: "🗺️",
          href: "/conteudo/territorio",
          comingSoon: true,
        },
        {
          key: "editorias",
          title: "Editorias",
          icon: "📚",
          href: "/conteudo/editorias",
          comingSoon: true,
        },
        {
          key: "ideias",
          title: "Ideias",
          icon: "💡",
          href: "/conteudo/ideias",
          locked: !progress.voz,
        },
        {
          key: "monoflow",
          title: "Monoflow",
          icon: "🔄",
          href: "/conteudo/monoflow",
          locked: !progress.voz,
        },
      ],
    },
    {
      title: "Produto",
      icon: "📦",
      items: [
        {
          key: "icp",
          title: "ICP",
          icon: "🎯",
          href: "/produto/icp",
        },
        {
          key: "oferta",
          title: "Oferta",
          icon: "💰",
          href: "/produto/oferta",
          locked: !progress.icp,
        },
        {
          key: "pitch",
          title: "Pitch",
          icon: "🎤",
          href: "/produto/pitch",
          locked: !progress.oferta,
        },
      ],
    },
  ];
}
