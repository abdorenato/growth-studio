import type { Progress } from "@/types";

export type NavItem = {
  key: string;
  title: string;
  icon: string;
  href: string;
  locked?: boolean;
  comingSoon?: boolean;
  /** Só aparece pra admins (is_admin). Usado pra features em rollout. */
  adminOnly?: boolean;
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
      title: "Estratégia",
      icon: "🎯",
      items: [
        {
          key: "voz",
          title: "Voz da Marca",
          icon: "🎙️",
          href: "/conteudo/voz",
        },
        {
          key: "icp",
          title: "ICP",
          icon: "🎯",
          href: "/produto/icp",
          locked: !progress.voz,
        },
        {
          key: "posicionamento",
          title: "Posicionamento",
          icon: "📍",
          href: "/conteudo/posicionamento",
          locked: !progress.voz || !progress.icp,
        },
        {
          key: "territorio",
          title: "Território",
          icon: "🗺️",
          href: "/conteudo/territorio",
          locked: !progress.posicionamento,
        },
        {
          key: "digital-id",
          title: "Digital ID",
          icon: "🪪",
          href: "/conteudo/digital-id",
          locked: !progress.territorio,
          adminOnly: true, // em rollout — só admins por enquanto
        },
      ],
    },
    {
      title: "Conteúdo",
      icon: "✨",
      items: [
        {
          key: "editorias",
          title: "Editorias",
          icon: "📚",
          href: "/conteudo/editorias",
          locked: !progress.territorio,
        },
        {
          key: "ideias",
          title: "Ideias",
          icon: "💡",
          href: "/conteudo/ideias",
          locked: !progress.editorias,
        },
        {
          key: "monoflow",
          title: "Monoflow",
          icon: "🔄",
          href: "/conteudo/monoflow",
          locked: !progress.icp,
        },
        {
          key: "roteiros",
          title: "Roteiros de Milhões",
          icon: "🎬",
          href: "/conteudo/roteiros",
          locked: !progress.icp,
          adminOnly: true, // em rollout — só admins por enquanto
        },
      ],
    },
    {
      title: "Produto",
      icon: "📦",
      items: [
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
    {
      title: "Presença",
      icon: "🪪",
      items: [
        {
          key: "bio",
          title: "Bio",
          icon: "🪪",
          href: "/presenca/bio",
          locked: !progress.posicionamento,
        },
        {
          key: "destaques",
          title: "Destaques",
          icon: "⭐",
          href: "/presenca/destaques",
          locked: !progress.editorias,
        },
      ],
    },
  ];
}
