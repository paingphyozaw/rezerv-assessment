import { allMembers, type Member } from './data';
import { request, sortAndPage, type PageQuery, type SortValues } from '../../lib/mockApi';

const MEMBER_SORT_VALUES: SortValues<Member> = {
  name: (m) => m.name,
  email: (m) => m.email,
  plan: (m) => m.plan,
  joined: (m) => m.joined,
  visits: (m) => m.visits,
  lastVisit: (m) => m.lastVisit,
  status: (m) => m.status
};

/** GET /members?sort=…&page=…&size=… — one sorted page. */
export function getMembers(query: PageQuery, signal?: AbortSignal) {
  return request(
    (empty) => sortAndPage(empty ? [] : allMembers(), MEMBER_SORT_VALUES, query),
    signal
  );
}
