package com.example.gestion_pharmacie.entites;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Client extends Utilisateur {

    public Client() {
        this.setRole(Role.CLIENT);
    }
}
