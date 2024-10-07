export function gettimewithoutzone() {
  const date = new Date().toISOString().replace('Z', '').replace('T', ' ')
  return date
}
