import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LearnModal.module.css';

interface LearnModalProps {
  onClose: () => void;
}

interface ResourceLink {
  title: string;
  url: string;
}

interface ResourceCategory {
  name: string;
  links: ResourceLink[];
}

export const LearnModal = forwardRef<HTMLDialogElement, LearnModalProps>(function LearnModal(
  { onClose },
  ref,
) {
  const { t } = useTranslation();
  const resources: ResourceCategory[] = [
    {
      name: t('learnModal.categoryUml'),
      links: [
        {
          title: t('learnModal.linkUmlClass'),
          url: 'https://www.visual-paradigm.com/guide/uml-unified-modeling-language/uml-class-diagram-tutorial/',
        },
        {
          title: t('learnModal.linkUmlRelationships'),
          url: 'https://www.visual-paradigm.com/guide/uml-unified-modeling-language/uml-aggregation-vs-composition/',
        },
        {
          title: t('learnModal.linkDdd'),
          url: 'https://martinfowler.com/bliki/DomainDrivenDesign.html',
        },
      ],
    },
    {
      name: t('learnModal.categoryBdd'),
      links: [
        {
          title: t('learnModal.linkGherkin'),
          url: 'https://cucumber.io/docs/gherkin/reference/',
        },
        {
          title: t('learnModal.linkBdd'),
          url: 'https://cucumber.io/docs/bdd/',
        },
        {
          title: t('learnModal.linkUseCases'),
          url: 'https://www.usability.gov/how-to-and-tools/methods/use-cases.html',
        },
      ],
    },
    {
      name: t('learnModal.categoryApi'),
      links: [
        {
          title: t('learnModal.linkRest'),
          url: 'https://restfulapi.net/',
        },
        {
          title: t('learnModal.linkHttp'),
          url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods',
        },
        {
          title: t('learnModal.linkApiNaming'),
          url: 'https://restfulapi.net/resource-naming/',
        },
      ],
    },
    {
      name: t('learnModal.categorySoftware'),
      links: [
        {
          title: t('learnModal.linkSolid'),
          url: 'https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design',
        },
        {
          title: t('learnModal.linkClean'),
          url: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
        },
      ],
    },
  ];
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
      <header className={styles.header}>
        <h2 className={styles.title}>{t('learnModal.title')}</h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('importModal.close')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </header>
      <div className={styles.body}>
        {resources.map(category => (
          <section key={category.name} className={styles.category}>
            <h3 className={styles.categoryName}>{category.name}</h3>
            <ul className={styles.linkList}>
              {category.links.map(link => (
                <li key={link.url} className={styles.linkItem}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {link.title}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      className={styles.externalIcon}
                    >
                      <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </dialog>
  );
});
