import { ServiceMarketplace } from '../../components/special-pages';
import { SessionScope } from '../../components/protected-session';
export default function Page(){return <SessionScope><ServiceMarketplace kind="referral"/></SessionScope>}
