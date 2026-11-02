import { supabase } from './supabase'

const BUCKET = 'profile-photos'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function uploadProfilePhoto(file, userId) {
  if (!supabase) throw new Error('Supabase is not configured.')
  if (!EXTENSIONS[file.type]) throw new Error('Choose a JPG, PNG, or WebP image.')
  if (file.size > MAX_FILE_SIZE) throw new Error('Profile photos must be 5 MB or smaller.')

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user || user.id !== userId) {
    throw new Error('Sign in again before changing your profile photo.')
  }

  const path = `${user.id}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw new Error(uploadError.message)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ profile_photo_path: path })
    .eq('id', user.id)

  if (profileError) {
    await supabase.storage.from(BUCKET).remove([path])
    throw new Error('The photo uploaded, but your profile could not be updated.')
  }

  return path
}

export async function getProfilePhotoUrl(path) {
  if (!supabase || !path) return null
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}

export async function removeProfilePhoto(path, userId) {
  if (!supabase || !path || !path.startsWith(`${userId}/`)) return
  await supabase.storage.from(BUCKET).remove([path])
}
