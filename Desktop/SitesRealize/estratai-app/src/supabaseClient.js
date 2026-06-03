import { createClient } from '@supabase/supabase-js'

// Substitua com a sua URL e Key do painel do Supabase
const supabaseUrl = 'https://jbvrrkqtnxqzszmfewfv.supabase.co'
const supabaseKey = 'sb_publishable_Asqonoa3Y5Joavgjk4t-6w_YAAuWeMS'

export const supabase = createClient(supabaseUrl, supabaseKey)