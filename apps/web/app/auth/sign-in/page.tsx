import { Suspense } from 'react';
import { SignIn } from '../../../components/auth';
import { Loading } from '../../../components/primitives';
export const metadata={title:'ورود به حساب'};
export default function SignInPage(){return <Suspense fallback={<Loading/>}><SignIn/></Suspense>}
