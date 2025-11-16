const express = require("express");
const router = express.Router();
const Group = require("../models/UserGroup");

// ✅ Show all groups
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.render("user_groups", { groups });
  } catch (err) {
    req.flash("error", "Failed to load groups");
    res.redirect("back");
  }
});

// ✅ Show add form
router.get("/add", (req, res) => {
  res.render("user_group_add");
});

// ✅ Handle add form submission
router.post("/add", async (req, res) => {
  try {
    const { name, level, status, description } = req.body;
    await Group.create({ name, level, status, description });
    req.flash("success", "Group added successfully!");
    res.redirect("/users/groups");
  } catch (err) {
    console.error("❌ Error adding group:", err);
    req.flash("error", "Failed to add group");
    res.redirect("/users/groups/add");
  }
});

// ✅ Edit page
router.get("/edit/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      req.flash("error", "Group not found");
      return res.redirect("/users/groups");
    }
    res.render("user_group_edit", { group });
  } catch (err) {
    req.flash("error", "Failed to load group for editing");
    res.redirect("/users/groups");
  }
});

// ✅ Handle edit submission
router.post("/edit/:id", async (req, res) => {
  try {
    const { name, level, status, description } = req.body;
    await Group.findByIdAndUpdate(req.params.id, { name, level, status, description });
    req.flash("success", "Group updated successfully!");
    res.redirect("/users/groups");
  } catch (err) {
    console.error("❌ Error updating group:", err);
    req.flash("error", "Failed to update group");
    res.redirect("/users/groups");
  }
});

// ✅ Show delete confirmation page
router.get("/delete/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      req.flash("error", "Group not found");
      return res.redirect("/users/groups");
    }
    res.render("user_group_delete", { group });
  } catch (err) {
    req.flash("error", "Failed to load delete confirmation");
    res.redirect("/users/groups");
  }
});

// ✅ Handle Delete submission
router.post("/delete/:id", async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.id);
    req.flash("success", "Group deleted successfully!");
    res.redirect("/users/groups");
  } catch (err) {
    req.flash("error", "Failed to delete group");
    res.redirect("/users/groups");
  }
});

module.exports = router;  