import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://brneicdqwdmvpixjdypk.supabase.co';
const supabaseKey = 'sb_publishable_GLpqG_0MCOroEv6VP4g47Q_NuSX8Uv2';

export const supabase = createClient(supabaseUrl, supabaseKey);
