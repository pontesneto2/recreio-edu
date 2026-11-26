import { AppShell, SideNav } from '@recreio/design-system';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { NAVIGATION } from '../config/navigation.ts';

const ITEMS = NAVIGATION.flatMap((group) => group.items);

const findActiveId = (pathname: string) =>
  ITEMS.filter((item) => (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)))[0]?.id;

export const PortalLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (id: string) => {
    const item = ITEMS.find((candidate) => candidate.id === id);
    if (item) navigate(item.href);
  };

  return (
    <AppShell
      sidenav={
        <SideNav
          school={{ name: 'Colégio Recreio', unit: 'Unidade Aldeota' }}
          groups={NAVIGATION}
          active={findActiveId(pathname)}
          onNavigate={handleNavigate}
        />
      }
    >
      <Outlet />
    </AppShell>
  );
};
