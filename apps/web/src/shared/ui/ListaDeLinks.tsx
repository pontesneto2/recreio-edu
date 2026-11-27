import { type Cat, Icon, cx } from '@recreio/design-system';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

export type LinkDaLista = {
  to: string;
  titulo: string;
  icone: string;
  descricao?: ReactNode;
  cor?: Cat;
  fim?: ReactNode;
};

type ListaDeLinksProps = { rotulo: string; links: LinkDaLista[] };

/**
 * Lista com o visual do `ListItem` do design system, mas com `Link` do React Router:
 * navega sem recarregar a página e continua abrindo em outra aba com o botão do meio.
 */
export const ListaDeLinks = ({ rotulo, links }: ListaDeLinksProps) => (
  <ul className="rc-list is-divided" aria-label={rotulo}>
    {links.map((link, index) => (
      <li key={link.to + link.titulo} className="rc-li" style={{ '--i': index }}>
        <Link className="rc-li-row is-action" to={link.to}>
          <span className="rc-li-lead">
            <span className={cx('rc-nat-ico is-lg', link.cor && `rc-c-${link.cor}`)}>
              <Icon name={link.icone} size={20} />
            </span>
          </span>
          <span className="rc-li-body">
            <span className="rc-li-title">{link.titulo}</span>
            {link.descricao && <span className="rc-li-meta">{link.descricao}</span>}
          </span>
          <span className="rc-li-trail">{link.fim ?? <Icon name="chevron-right" size={18} />}</span>
        </Link>
      </li>
    ))}
  </ul>
);
