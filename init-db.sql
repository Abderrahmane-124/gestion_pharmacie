-- Script d'initialisation pour corriger la contrainte de rôle
-- Ce script permet d'ajouter le rôle CLIENT aux rôles acceptés

-- Supprimer l'ancienne contrainte si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'utilisateur_role_check' 
        AND pg_get_constraintdef(oid) NOT LIKE '%CLIENT%'
    ) THEN
        ALTER TABLE utilisateur DROP CONSTRAINT IF EXISTS utilisateur_role_check;
        ALTER TABLE utilisateur ADD CONSTRAINT utilisateur_role_check 
            CHECK (role IN ('PHARMACIEN', 'FOURNISSEUR', 'CLIENT'));
        RAISE NOTICE 'Contrainte utilisateur_role_check mise à jour avec succès pour inclure CLIENT';
    END IF;
END $$;
