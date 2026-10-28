import { CorporateEntry } from '../../components/special-pages';
import { SessionScope } from '../../components/protected-session';
export default function Page(){return <SessionScope><CorporateEntry/></SessionScope>}
