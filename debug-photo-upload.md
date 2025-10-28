# Debug Photo Upload

## Checklist om te controleren:

1. **SQL uitgevoerd?** 
   - Heb je `drizzle/add-user-id-to-photos.sql` uitgevoerd? (user_id kolom toevoegen)
   - Heb je `drizzle/fix-photos-rls-final.sql` uitgevoerd? (RLS policies)

2. **Vercel Deployment:**
   - Is de deployment van de Camera branch succesvol?
   - Check: https://vercel.com/ -> Jouw project -> Deployments
   - De laatste deployment moet "Ready" zijn

3. **Test opnieuw en check console:**
   - Open Developer Tools (F12)
   - Ga naar Network tab
   - Probeer foto te uploaden
   - Klik op de failed request naar `/api/photos`
   - Bekijk de Response tab voor het exacte error bericht

4. **Vercel Function Logs:**
   - Ga naar: https://vercel.com/dashboard
   - Selecteer je project
   - Ga naar "Functions" tab
   - Zoek naar de `/api/photos` functie
   - Open de laatste invocation
   - Kopieer de error logs

## Wat te delen:
- De exacte error message uit de browser console
- Of de SQL scripts zijn uitgevoerd
- Of de deployment succesvol was

