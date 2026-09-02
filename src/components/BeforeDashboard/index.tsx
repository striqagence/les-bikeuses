import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { ImportButton } from './ImportButton'
import { NavigationButton } from './NavigationButton'
import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Bienvenue sur le back-office Les Bikeuses</h4>
      </Banner>

      <p>
        <strong>1. Le catalogue.</strong> Les articles citent des produits dans leurs
        carrousels : importer le catalogue en premier, sinon ces carrousels sont
        omis faute de produits à référencer.
      </p>
      <ImportButton quoi="produits" />

      <p style={{ marginTop: '1rem' }}>
        Cet import ne prend que le visuel de tête. Le bouton ci-dessous complète les
        fiches avec les visuels secondaires — coloris, dos, détails de coque —, soit
        deux à seize par référence. Comptez une vingtaine de minutes : chaque visuel
        est téléchargé, redimensionné en sept déclinaisons puis renvoyé sur Supabase.
      </p>
      <ImportButton quoi="galeries" />

      <p style={{ marginTop: '1.5rem' }}>
        <strong>2. Les articles.</strong> Reprise depuis lesbikeuses.fr. L’import se fait par
        lots et reprend là où il s’est arrêté : on peut l’interrompre et le relancer
        sans rien dupliquer. Les articles déjà en base sont sautés, et les visuels sont
        récupérés au passage.
      </p>
      <ImportButton />

      <p style={{ marginTop: '1rem' }}>
        Les huit premiers articles avaient été posés par le seed depuis un export figé,
        antérieur à la reprise des images et des liens. Le bouton ci-dessous les remet à
        jour — il repasse sur tous les articles, comptez une dizaine de minutes.
      </p>
      <ImportButton forcer />

      <p style={{ marginTop: '1.5rem' }}>
        <strong>3. La navigation.</strong> Une fois le catalogue importé, fait pointer
        « Équipements », « Accessoires » et « Vêtements » vers les rayons de ce site au
        lieu de l’ancien. Ne touche qu’au menu et au pied de page — contrairement au
        seed, qui viderait les collections.
      </p>
      <NavigationButton />

      <hr style={{ margin: '1.5rem 0', opacity: 0.2 }} />

      Ensuite :
      <ul className={`${baseClass}__instructions`}>
        <li>
          <SeedButton />
          {' with a few pages, posts, and projects to jump-start your new site, then '}
          <a href="/" target="_blank">
            visit your website
          </a>
          {' to see the results.'}
        </li>
        <li>
          {'Modify your '}
          <a
            href="https://payloadcms.com/docs/configuration/collections"
            rel="noopener noreferrer"
            target="_blank"
          >
            collections
          </a>
          {' and add more '}
          <a
            href="https://payloadcms.com/docs/fields/overview"
            rel="noopener noreferrer"
            target="_blank"
          >
            fields
          </a>
          {' as needed. If you are new to Payload, we also recommend you check out the '}
          <a
            href="https://payloadcms.com/docs/getting-started/what-is-payload"
            rel="noopener noreferrer"
            target="_blank"
          >
            Getting Started
          </a>
          {' docs.'}
        </li>
        <li>
          Commit and push your changes to the repository to trigger a redeployment of your project.
        </li>
      </ul>
      {'Pro Tip: This block is a '}
      <a
        href="https://payloadcms.com/docs/custom-components/overview"
        rel="noopener noreferrer"
        target="_blank"
      >
        custom component
      </a>
      , you can remove it at any time by updating your <strong>payload.config</strong>.
    </div>
  )
}

export default BeforeDashboard
