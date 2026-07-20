package com.digitaltwin.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "farms")
public class Farm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer farm_id;

    private String farm_name;

    private String owner_name;

    private String location;

    private Double total_area;

    public Integer getFarm_id() {
        return farm_id;
    }

    public void setFarm_id(Integer farm_id) {
        this.farm_id = farm_id;
    }

    public String getFarm_name() {
        return farm_name;
    }

    public void setFarm_name(String farm_name) {
        this.farm_name = farm_name;
    }

    public String getOwner_name() {
        return owner_name;
    }

    public void setOwner_name(String owner_name) {
        this.owner_name = owner_name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getTotal_area() {
        return total_area;
    }

    public void setTotal_area(Double total_area) {
        this.total_area = total_area;
    }
}