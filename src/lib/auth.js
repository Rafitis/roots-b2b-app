import { supabase } from "@lib/supabase";

export async function getUser(req) {
    const cookieHeader = req.headers.get('cookie') || '';
    let accessToken = cookieHeader
      .split('; ')
      .find((item) => item.startsWith('sb-access-token='))

    if (!accessToken) {
        return null;
    }
        
    accessToken = accessToken.split('=')[1]
    const { data: {user} } = await supabase.auth.getUser(accessToken);
    if (!user || user.role !== 'authenticated') {
        return null;
    }
    return user
}

export async function getUserFromCookie(req) {
    return await getUser(req) != null
}