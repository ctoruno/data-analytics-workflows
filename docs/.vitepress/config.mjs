import { defineConfig } from 'vitepress'
import lightbox from "vitepress-plugin-lightbox"

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Designing Data and Analytical Workflows",
  description: "A guide for implementing reproducible, maintainable, and optimal workflows in R and Python",
  base: "/data-analytics-workflows/",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: "Designing Data and<br>Analytical Workflows",
    nav: [
      { text: "Home", link: "/" },
      { text: "Foundations", link: "/introduction" },
      { text: "Checklist", link: "/checklist" }
    ],

    outline: {
      level: [2, 3],
      label: "On this page"
    },

    sidebar: [
      {
        text: "Foundations",
        items: [
          { text: "Introduction", link: "/introduction" },
          { text: "Who Wrote This?", link: "/about_me" },
          { text: "Principles for Data and Analytical Workflows", link: "/data_workflow_principles" }
        ]
      },
      {
        text: "Reproducibility",
        items: [
          { text: "Reproducibility in Practice", link: "/reproducibility" },
          { text: "Openness", link: "/openness" },
          { text: "Portability", link: "/portability" },
          { text: "Traceability", link: "/traceability" },
          { text: "Setting Up A Reproducible Workflow in R", link: "/r_reproducible_workflow" },
          { text: "Setting Up A Reproducible Workflow in Python", link: "/python_reproducible_workflow" },
        ]
      },
      {
        text: "Maintainability",
        items: [
          { text: "Maintainability in Practice", link: "/maintainability" },
          { text: "Readability", link: "/readability" },
          { text: "Modularity", link: "/modularity" },
          { text: "Observability", link: "/observability" },
          { text: "Idiomaticity", link: "/idiomaticity" },
        ]
      },
      {
        text: "Optimality",
        items: [
          { text: "Optimality in Practice", link: "/optimality" },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ctoruno/data-analytics-workflows' }
    ]
  },
  markdown: {
    config: (md) => {
      md.use(lightbox, {})
    },
  },
})
