import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleState extends Equatable {
  const LocaleState({required this.locale, this.themeMode = ThemeMode.light});

  final Locale locale;
  final ThemeMode themeMode;

  LocaleState copyWith({Locale? locale, ThemeMode? themeMode}) => LocaleState(
        locale: locale ?? this.locale,
        themeMode: themeMode ?? this.themeMode,
      );

  @override
  List<Object?> get props => [locale, themeMode];
}

class LocaleCubit extends Cubit<LocaleState> {
  LocaleCubit(this.prefs)
      : super(LocaleState(
          locale: Locale(prefs.getString(_key) ?? 'en'),
          themeMode: prefs.getBool(_darkKey) == true
              ? ThemeMode.dark
              : ThemeMode.light,
        ));

  final SharedPreferences prefs;
  static const _key = 'suwasiri_locale';
  static const _darkKey = 'suwasiri_dark_mode';

  void setLocale(Locale locale) {
    prefs.setString(_key, locale.languageCode);
    emit(state.copyWith(locale: locale));
  }

  void toggleDarkMode() {
    final isDark = state.themeMode == ThemeMode.dark;
    prefs.setBool(_darkKey, !isDark);
    emit(state.copyWith(themeMode: isDark ? ThemeMode.light : ThemeMode.dark));
  }

  bool get isDarkMode => state.themeMode == ThemeMode.dark;

  void cycle() {
    const order = ['en', 'si', 'ta'];
    final i = order.indexOf(state.locale.languageCode);
    final next = order[(i + 1) % order.length];
    setLocale(Locale(next));
  }

  String get pillLabel {
    switch (state.locale.languageCode) {
      case 'si':
        return 'සිං';
      case 'ta':
        return 'TA';
      default:
        return 'EN';
    }
  }
}
